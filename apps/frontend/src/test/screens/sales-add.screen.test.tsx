import { beforeEach, describe, expect, it } from 'vitest'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { lastPrintedText, printedDocuments } from '@/test/printed.ts'
import { signedInAs } from '@/test/screen.tsx'

const buyer = {
  lastName: 'Petit',
  firstName: 'Anna',
  phoneNumber: '0633333333',
  city: 'Annecy',
}

// A buyer brings two articles from deposit n°12 to cash register 2000 and
// pays cash. The volunteer scans both codes, types the buyer, enters the
// payment and saves.
describe('Screen: sell two articles to a walk-in buyer', () => {
  let codes: Array<string>
  let articleIds: Array<string>

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [
      { price: 120 },
      { price: 80, category: 'Chaussures', brand: 'Nordica' },
    ])
    codes = articles.map((a) => a.code)
    articleIds = articles.map((a) => a.id)
  })

  it('lists the scanned articles, takes the payment, marks them sold, and moves on to the next sale number', async () => {
    const page = await salesAddPage()
    expect(page.saleIndex()).toBe(2001)

    await page.scan(codes[0])
    await page.scan(codes[1])
    expect(page.scannedCodes()).toEqual([`${YEAR} 12A`, `${YEAR} 12B`])
    expect(page.total()).toBe(200)

    await page.fillBuyer(buyer)
    await page.pay({ cash: 200 })
    expect(page.totalPayment()).toBe(200)

    await page.save()
    await page.savedToast(2001)

    const contacts = await local.contacts()
    const anna = contacts.find((c) => c.lastName === 'Petit')
    const [sale] = await local.sales()
    expect(anna).toMatchObject({
      firstName: 'Anna',
      phoneNumber: '0633333333',
      city: 'Annecy',
    })
    expect(sale).toMatchObject({
      saleIndex: 2001,
      incrementStart: 2000,
      buyerId: anna?.id,
      cashAmount: 200,
      cardAmount: 0,
      checkAmount: 0,
      deferredAmount: 0,
      totalRefundAmount: 0,
    })
    const sold = (await local.articles()).filter((a) =>
      articleIds.includes(a.id),
    )
    expect(sold.map((a) => [a.status, a.saleId])).toEqual([
      ['SOLD', sale.id],
      ['SOLD', sale.id],
    ])
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([
      ['contacts', 'create'],
      ['sales', 'create'],
      ['articles', 'update'],
      ['articles', 'update'],
    ])

    // Ready for the next buyer
    expect(page.scannedCodes()).toEqual([])
    expect(page.buyer().lastName).toBe('')
    expect(page.saleIndex()).toBe(2002)
  })
})

// The four payment modes must add up to the total, to the euro.
describe('Screen: the payment must cover the total', () => {
  let code: string

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [{ price: 200 }])
    code = articles[0].code
  })

  it('refuses a short payment, accepts a split one', async () => {
    const page = await salesAddPage()
    await page.scan(code)
    await page.fillBuyer(buyer)

    await page.pay({ cash: 150 })
    await page.save()
    expect(page.errors()).toEqual([
      'Merci de vérifier que le montant total est couvert par les 4 modes de règlements.',
    ])
    expect(await local.sales()).toEqual([])

    await page.pay({ card: 50 })
    expect(page.totalPayment()).toBe(200)
    await page.save()
    await page.savedToast(2001)

    expect((await local.sales())[0]).toMatchObject({
      cashAmount: 150,
      cardAmount: 50,
    })
  })
})

// Only an article received at the deposit desk, and not yet sold, can go
// through the till. Every refusal is a blocking alert the volunteer must
// acknowledge, and the article is not added.
describe('Screen: refused scans', () => {
  let codes: Record<string, string>

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [
      {},
      { status: 'RECEPTION_PENDING' },
      { status: 'SOLD', saleId: 'some-earlier-sale' },
      { status: 'DELETED' },
      { status: 'RETURNED' },
    ])
    codes = {
      ok: articles[0].code,
      pending: articles[1].code,
      sold: articles[2].code,
      deleted: articles[3].code,
      returned: articles[4].code,
      unknown: `${YEAR} 99Z`,
    }
  })

  it.each([
    ['unknown', 'Erreur', (c: string) => `Article ${c} inconnu`],
    ['sold', 'Erreur', (c: string) => `Article ${c} déja vendu`],
    [
      'pending',
      'Article non réceptionné',
      (c: string) =>
        `L'article ${c} n'a pas été réceptionné au dépôt : il ne peut pas être vendu. Faites-le réceptionner avant de l'encaisser.`,
    ],
    [
      'deleted',
      'Article invendable',
      (c: string) => `Article ${c} invendable, contactez l'administrateur`,
    ],
    [
      'returned',
      'Article restitué',
      (c: string) =>
        `L'article ${c} a été restitué à son déposant : il ne peut pas être vendu.`,
    ],
  ])('refuses a %s article with an alert', async (kind, title, message) => {
    const page = await salesAddPage()
    await page.scan(codes[kind])

    const alert = await page.alert()
    expect(alert.title).toBe(title)
    expect(alert.message).toBe(message(codes[kind]))
    await alert.dismiss()

    expect(page.isAlertOpen()).toBe(false)
    expect(page.scannedCodes()).toEqual([])
    expect(page.total()).toBe(0)
  })

  it('adds an article once, however many times it is scanned', async () => {
    const page = await salesAddPage()
    await page.scan(codes.ok)
    await page.scan(codes.ok)

    expect(page.scannedCodes()).toEqual([codes.ok])
    expect(page.total()).toBe(120)
  })
})

// The invoice is the buyer's receipt. It is printed on demand, follows the
// same rules as the save, and is not required to save.
describe('Screen: the invoice', () => {
  let codes: Array<string>

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [
      { price: 120 },
      { price: 80, category: 'Chaussures', brand: 'Nordica' },
    ])
    codes = articles.map((a) => a.code)
  })

  it('is not printed for an incomplete sale', async () => {
    const page = await salesAddPage()
    await page.scan(codes[0])
    await page.pay({ cash: 120 })

    await page.clickInvoice()

    expect(page.errors()).toEqual([
      'Le nom est requis',
      'Le prénom est requis',
      'Le téléphone est requis',
    ])
    expect(printedDocuments()).toBe(0)
  })

  it('is not printed while the payment is short', async () => {
    const page = await salesAddPage()
    await page.scan(codes[0])
    await page.fillBuyer(buyer)
    await page.pay({ cash: 100 })

    await page.clickInvoice()

    expect(page.errors()).toEqual([
      'Merci de vérifier que le montant total est couvert par les 4 modes de règlements.',
    ])
    expect(printedDocuments()).toBe(0)
  })

  it('prints the buyer, the articles, the total and the payment split', async () => {
    const page = await salesAddPage()
    await page.scan(codes[0])
    await page.scan(codes[1])
    await page.fillBuyer(buyer)
    await page.pay({ cash: 150, card: 50 })

    await page.printInvoice()

    expect(printedDocuments()).toBe(1)
    const text = await lastPrintedText()
    expect(text).toContain('Facture N°2001')
    expect(text).toContain('PETIT Anna')
    expect(text).toContain('0633333333')
    expect(text).toContain(codes[0])
    expect(text).toContain(codes[1])
    expect(text).toContain('Rossignol')
    expect(text).toContain('Nordica')
    expect(text).toContain("Nombre d'articles : 2")
    expect(text).toContain('Total : 200,00 €')
    expect(text).toContain('Espèces : 150,00 €')
    expect(text).toContain('Carte : 50,00 €')
    expect(text).toContain('Chèque : 0,00 €')

    // Printing is not a condition for saving; the sale still saves after it.
    await page.save()
    await page.savedToast(2001)
  })

  // Current behaviour, pinned: the deferred part of a payment is not on the
  // invoice, so its payment lines add up to less than its total. To revisit.
  it('does not print the deferred amount', async () => {
    const page = await salesAddPage()
    await page.scan(codes[0])
    await page.fillBuyer(buyer)
    await page.pay({ card: 70, deferred: 50 })

    await page.printInvoice()

    const text = await lastPrintedText()
    expect(text).toContain('Total : 120,00 €')
    expect(text).toContain('Carte : 70,00 €')
    expect(text).not.toMatch(/[Dd]ifféré/)
    // Nothing on the paper says 50 € remain due.
    expect(text).not.toContain('50,00 €')
  })
})
