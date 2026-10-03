import { beforeEach, describe, expect, it } from 'vitest'
import type { Section } from '@/test/pages/sales-control.page.ts'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { salesControlPage } from '@/test/pages/sales-control.page.ts'
import { salesListingPage } from '@/test/pages/sales-listing.page.ts'
import { lastPrintedText, printedDocuments } from '@/test/printed.ts'
import {
  openScreen,
  screen,
  signedInAs,
  waitFor,
  within,
} from '@/test/screen.tsx'

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

// Camille Durand left skis this morning, and comes back in the afternoon
// to buy boots. Already a contact, Camille is found in the list instead of
// being typed again.
describe('Screen: sell to a buyer already known', () => {
  let code: string

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [{ price: 80 }])
    code = articles[0].code
  })

  // A sale's line in « Gérer les ventes », found by its number.
  const saleRow = (saleIndex: number): Array<string> => {
    const row = screen
      .queryAllByRole('row')
      .map((line) =>
        within(line)
          .queryAllByRole('cell')
          .map((cell) => cell.textContent.trim()),
      )
      .find((cells) => cells.includes(String(saleIndex)))
    return row ?? []
  }

  it('fills the buyer from the contact picked in the list, and sells to that contact', async () => {
    const page = await salesAddPage()
    await page.scan(code)
    // Picking a contact is enough: there is no "Valider" after it.
    expect(page.hasButton('Valider')).toBe(false)

    await page.pickBuyer('Durand Camille')

    expect(page.buyer()).toEqual({
      lastName: 'Durand',
      firstName: 'Camille',
      phoneNumber: '0600000000',
    })
    expect(page.buyerCity()).toBe('Grenoble')

    await page.pay({ cash: 80 })
    await page.save()
    await page.savedToast(2001)

    // The sale is Camille's in the list of sales…
    await openScreen('/sales/listing')
    await screen.findByRole('heading', { name: 'Gérer les ventes' })
    await waitFor(() => expect(saleRow(2001)).toContain('Durand Camille'))

    // …and no second Camille was made: the next sale offers Camille once.
    const next = await salesAddPage()
    expect(await next.offeredBuyers('Durand')).toEqual(['Durand Camille'])
  })

  // Picking the same contact a second time, by a slip of the hand, must
  // not undo it.
  it('keeps the buyer when the same contact is picked again', async () => {
    const page = await salesAddPage()
    await page.pickBuyer('Durand Camille')

    await page.pickBuyer('Durand Camille')

    expect(page.buyer().lastName).toBe('Durand')
    expect(page.selectedBuyer()).toBe('Durand Camille')
  })

  // The list shows the contact the buyer block was filled from; once the
  // volunteer retypes the buyer by hand, it is no longer that contact.
  it('empties the list when the buyer is then retyped by hand', async () => {
    const page = await salesAddPage()
    await page.pickBuyer('Durand Camille')
    expect(page.selectedBuyer()).toBe('Durand Camille')

    await page.fillBuyer({ phoneNumber: '1' })

    await waitFor(() => expect(page.selectedBuyer()).toBeNull())
  })

  // The volunteer often starts typing the name, then recognises the buyer
  // and picks Camille in the list. What was typed before is overwritten by
  // the contact: the sale must still go to Camille, not to a copy.
  it('sells to the contact picked after the buyer was partly typed by hand', async () => {
    const page = await salesAddPage()
    await page.scan(code)
    await page.fillBuyer({ lastName: 'Dur' })

    await page.pickBuyer('Durand Camille')

    expect(page.buyer().lastName).toBe('Durand')
    expect(page.selectedBuyer()).toBe('Durand Camille')

    await page.pay({ cash: 80 })
    await page.save()
    await page.savedToast(2001)

    // The sale is Camille's in the list of sales…
    await openScreen('/sales/listing')
    await screen.findByRole('heading', { name: 'Gérer les ventes' })
    await waitFor(() => expect(saleRow(2001)).toContain('Durand Camille'))

    // …and no second Camille was made: the next sale offers Camille once.
    const next = await salesAddPage()
    expect(await next.offeredBuyers('Durand')).toEqual(['Durand Camille'])
  })
})

// An article can be marked sold without any sale attached to it (a sale
// lost on the way, a status corrected by hand). It is sold all the same: the
// till must not sell it a second time.
describe('Screen: an article sold without a sale', () => {
  it('is refused with the "already sold" alert', async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [
      { status: 'SOLD', saleId: null },
    ])
    const code = articles[0].code

    const page = await salesAddPage()
    await page.scan(code)

    const alert = await page.alert()
    expect(alert.title).toBe('Article déjà vendu')
    expect(alert.message).toBe(`L'article ${code} a déjà été vendu.`)
    await alert.dismiss()
    expect(page.scannedCodes()).toEqual([])
    expect(page.total()).toBe(0)
  })
})

// The buyer changes their mind at the till and leaves one article on the
// counter: the volunteer takes it out of the sale, and the count and the
// amount to pay follow.
describe('Screen: taking a scanned article back out of the sale', () => {
  it('removes the line and recomputes the count and the total', async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [
      { price: 120 },
      { price: 80 },
      { price: 30 },
    ])
    const page = await salesAddPage()
    for (const article of articles) await page.scan(article.code)
    expect(page.articleCount()).toBe(3)
    expect(page.total()).toBe(230)

    await page.removeScanned(1)

    expect(page.scannedCodes()).toEqual([articles[0].code, articles[2].code])
    expect(page.articleCount()).toBe(2)
    expect(page.total()).toBe(150)
  })
})

describe('Screen: how the buyer pays', () => {
  let code: string

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [{ price: 100 }])
    code = articles[0].code
  })

  // The volunteer types 120 € in cash for a 100 € article (the cash handed
  // over rather than the price): the till refuses, the change is not a
  // payment, and no sale is recorded.
  it('refuses a payment above the total, and saves nothing', async () => {
    const page = await salesAddPage()
    await page.scan(code)
    await page.fillBuyer(buyer)
    await page.pay({ cash: 60, card: 30, check: 20, deferred: 10 })
    expect(page.totalPayment()).toBe(120)

    await page.save()

    expect(page.errors()).toEqual([
      'Merci de vérifier que le montant total est couvert par les 4 modes de règlements.',
    ])
    // Still the same sale on screen, with its article
    expect(page.saleIndex()).toBe(2001)
    expect(page.scannedCodes()).toEqual([code])
    // And no sale among the sales of the day
    const listing = await salesListingPage()
    expect(listing.salesCount()).toBe(0)
    expect(listing.saleIndexes()).toEqual([])
  })

  // A buyer pays part in cash, part by card, part by cheque, and the club
  // agrees to collect the rest later. Each part must be found in its own
  // section of the till count at the end of the day.
  it('records each of the four payment modes on its own', async () => {
    const page = await salesAddPage()
    await page.scan(code)
    await page.fillBuyer(buyer)
    await page.pay({ cash: 20, card: 30, check: 40, deferred: 10 })
    expect(page.totalPayment()).toBe(100)

    await page.save()
    await page.savedToast(2001)

    const control = await salesControlPage()
    const paidBy = async (section: Section) => {
      await control.open(section)
      await waitFor(() => expect(control.rows()).toHaveLength(1))
      const [row] = control.rows()
      // Sale number, then what the sale is worth, then what this mode took
      return [row[0], row[4], row[5]]
    }
    expect(await paidBy('cashSales')).toEqual(['2001', '100,00 €', '20,00 €'])
    expect(await paidBy('card')).toEqual(['2001', '100,00 €', '30,00 €'])
    expect(await paidBy('check')).toEqual(['2001', '100,00 €', '40,00 €'])
    expect(await paidBy('deferred')).toEqual(['2001', '100,00 €', '10,00 €'])
  })

  // The volunteer types an amount and, out of habit, presses Enter to move
  // on. The sale must not be saved behind their back: only the button saves.
  it('does not save the sale when Enter is pressed in another field', async () => {
    const page = await salesAddPage()
    await page.scan(code)
    await page.fillBuyer(buyer)
    await page.pay({ cash: 100 })

    await page.pressEnterIn('Montant espèces')
    await page.pressEnterIn('Nom')

    await page.expectNotSaved(2001)
    expect(page.saleIndex()).toBe(2001)
    expect(page.scannedCodes()).toEqual([code])
    expect(page.buyer().lastName).toBe('Petit')

    // The button still saves it
    await page.save()
    await page.savedToast(2001)
  })
})

// Prices are in euros and cents: the total and the payments are added up
// to the cent, so 10,10 € + 20,20 € is 30,30 €, not 30,299999999999997 €.
describe('Screen: prices with cents', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
  })

  async function twoArticlesAt1010And2020() {
    const { articles } = await givenDeposit({}, [
      { price: 10.1 },
      { price: 20.2 },
    ])
    const page = await salesAddPage()
    await page.scan(articles[0].code)
    await page.scan(articles[1].code)
    await page.fillBuyer(buyer)
    return page
  }

  it('shows a total of 30,30 € and accepts an exact cash payment of 30,30 €', async () => {
    const page = await twoArticlesAt1010And2020()
    expect(page.totalText()).toBe('Montant total : 30.3€')

    await page.pay({ cash: 30.3 })
    expect(page.totalPayment()).toBe(30.3)
    await page.save()
    await page.savedToast(2001)

    const listing = await salesListingPage()
    expect(listing.saleIndexes()).toEqual(['2001'])
  })

  it('refuses a payment one cent short of 30,30 €, and saves nothing', async () => {
    const page = await twoArticlesAt1010And2020()

    await page.pay({ cash: 30.29 })
    await page.save()

    expect(page.errors()).toEqual([
      'Merci de vérifier que le montant total est couvert par les 4 modes de règlements.',
    ])
    await page.expectNotSaved(2001)
  })

  it('accepts the same 30,30 € when it is split as 10,10 € cash and 20,20 € card', async () => {
    const page = await twoArticlesAt1010And2020()

    await page.pay({ cash: 10.1, card: 20.2 })
    expect(page.totalPayment()).toBe(30.3)
    await page.save()
    await page.savedToast(2001)
  })
})
