import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { cashRegisterControlPage } from '@/test/pages/cash-register-control.page.ts'
import { returnsChecksPage } from '@/test/pages/returns-checks.page.ts'
import { returnsIndividualsPage } from '@/test/pages/returns-individuals.page.ts'
import { returnsListingPage } from '@/test/pages/returns-listing.page.ts'
import { db } from '@/db.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// The evening: the club runs the calculation over every deposit at once,
// and the listing shows each seller what is owed.
describe('Screen: the return listing', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    // A private seller who sold 200 € and still owes the 2 € contribution
    await givenDeposit(
      {
        depositIndex: 12,
        contributionStatus: 'A_PAYER',
        contributionAmount: 2,
        seller: { lastName: 'Durand', firstName: 'Camille' },
      },
      [
        { price: 120, saleId: 'a-sale', status: 'SOLD' },
        { price: 80, saleId: 'a-sale', status: 'SOLD' },
      ],
    )
    // A professional who sold 200 €
    await givenDeposit(
      {
        depositIndex: 3,
        type: 'PRO',
        contributionStatus: 'PRO',
        contributionAmount: 0,
        seller: { lastName: 'Alpha', firstName: 'Ski' },
      },
      [{ price: 200, saleId: 'a-sale', status: 'SOLD' }],
    )
  })

  // Once the seller's cheque is written, what it says is final: the
  // calculation leaves the fiche alone, whatever changes afterwards. The
  // other fiches are computed as usual.
  it('leaves a fiche alone once its cheque is written', async () => {
    const listing = await returnsListingPage()
    await waitFor(() => expect(listing.counters().toCompute).toBe(2))
    await listing.selectAll()
    await listing.computeSelected()
    await waitFor(() => expect(listing.soldAmount(12)).toBe('200,00 €'))

    const cheques = await returnsIndividualsPage()
    await cheques.pickDeposit('Durand')
    await cheques.fillCheque({ signatory: 'Camille Durand', checkId: '1042' })
    await cheques.printCheque()
    await cheques.nextCheque()
    await waitFor(() => expect(cheques.depositRow()).toBeNull())

    // Later, one of Durand's articles and the pro's come off their sale.
    for (const article of await local.articles()) {
      if (article.price === 80) continue
      await db.articles.update(article.id, {
        saleId: null,
        status: 'RECEPTION_OK',
      })
    }

    const again = await returnsListingPage()
    await waitFor(() => expect(again.soldAmount(12)).toBe('200,00 €'))
    await again.selectAll()
    await again.computeSelected()

    // The pro, without a cheque, is computed again: nothing sold any more.
    await waitFor(() => expect(again.soldAmount(3)).toBe(''))
    expect(again.soldAmount(12)).toBe('200,00 €')
    const durand = (await local.deposits()).find((d) => d.depositIndex === 12)
    expect(durand?.sellerAmount).toBe(178)
  })

  // By exception, a sale is cancelled after the seller's cheque is written
  // (an article bought by the club, found again). The fiche is computed again
  // to set it right, once the administrator has said yes. The cheque keeps
  // what is written on it, and the return sheet says what the seller has to
  // give back.
  it('computes a fiche again after its cheque once asked, and the cheque keeps its amount', async () => {
    const listing = await returnsListingPage()
    await waitFor(() =>
      expect(listing.returnStatus(12)).toBe('RETOUR A CALCULER'),
    )
    await listing.computeOne(12)
    await waitFor(() => expect(listing.soldAmount(12)).toBe('200,00 €'))

    const cheques = await returnsIndividualsPage()
    await cheques.pickDeposit('Durand')
    await cheques.fillCheque({ signatory: 'Camille Durand', checkId: '1042' })
    await cheques.printCheque()
    await cheques.nextCheque()
    await waitFor(() => expect(cheques.depositRow()).toBeNull())

    // The 120 € article comes off its sale.
    const skis = (await local.articles()).find((a) => a.price === 120)!
    await db.articles.update(skis.id, { saleId: null, status: 'RECEPTION_OK' })

    const again = await returnsListingPage()
    await waitFor(() => expect(again.soldAmount(12)).toBe('200,00 €'))
    await again.computeOne(12)
    let question = await again.question()
    expect(question.title).toBe('Recalculer la fiche 12 ?')
    expect(question.text).toContain(
      'Le chèque n° 1042 de 178,00 € est déjà fait',
    )
    await question.decline()
    expect(again.soldAmount(12)).toBe('200,00 €')

    await again.computeOne(12)
    question = await again.question()
    await question.confirm()

    // 80 € sold: 8 € for the club, the 2 € contribution, 70 € for the seller.
    await waitFor(() => expect(again.soldAmount(12)).toBe('80,00 €'))
    expect(
      (await local.deposits()).find((d) => d.depositIndex === 12),
    ).toMatchObject({
      sellerAmount: 70,
      contributionStatus: 'DEDUITE',
      signatory: 'Camille Durand',
      checkId: '1042',
      checkAmount: 178,
    })
    const sheet = await again.printReturnSheet(12)
    expect(sheet).toMatch(/Montant à régler: 70,00 €/)
    expect(sheet).toMatch(/Chèque n° 1042 déjà fait: 178,00 €/)
    expect(sheet).toMatch(/Trop-perçu à rembourser: 108,00 €/)

    signedInAs('ADMIN')
    const checks = await returnsChecksPage()
    await waitFor(() => expect(checks.amount(12)).toBe('178,00 €'))
  })

  // A cheque written before its amount was kept with it: the fiche still
  // carries that amount, unchanged since the cheque. It becomes the
  // cheque's before the fiche is computed again.
  it('keeps the amount of a cheque written before amounts were kept', async () => {
    const { articles } = await givenDeposit(
      {
        depositIndex: 40,
        soldAmount: 150,
        clubAmount: 15,
        dueContributionAmount: 0,
        sellerAmount: 135,
        returnedCalculationDate: new Date(),
        signatory: 'Léa Petit',
        checkId: '1043',
        collectedAt: new Date(),
        seller: { lastName: 'Petit', firstName: 'Léa' },
      },
      [
        { price: 100, saleId: 'a-sale', status: 'SOLD' },
        { price: 50, saleId: 'a-sale', status: 'SOLD' },
      ],
    )
    await db.articles.update(articles[1].id, {
      saleId: null,
      status: 'RECEPTION_OK',
    })
    const page = await returnsListingPage()
    await waitFor(() => expect(page.soldAmount(40)).toBe('150,00 €'))

    await page.computeOne(40)
    const question = await page.question()
    expect(question.text).toContain(
      'Le chèque n° 1043 de 135,00 € est déjà fait',
    )
    await question.confirm()

    await waitFor(() => expect(page.soldAmount(40)).toBe('100,00 €'))
    expect(
      (await local.deposits()).find((d) => d.depositIndex === 40),
    ).toMatchObject({ sellerAmount: 90, checkId: '1043', checkAmount: 135 })
    const sheet = await page.printReturnSheet(40)
    expect(sheet).toMatch(/Trop-perçu à rembourser: 45,00 €/)
  })

  // A fiche whose cheque matches what it says: its sheet prints as usual.
  it('prints no cheque line on a sheet whose cheque matches it', async () => {
    await givenDeposit(
      {
        depositIndex: 40,
        soldAmount: 150,
        clubAmount: 15,
        dueContributionAmount: 0,
        sellerAmount: 135,
        returnedCalculationDate: new Date(),
        signatory: 'Léa Petit',
        checkId: '1043',
        checkAmount: 135,
        seller: { lastName: 'Petit', firstName: 'Léa' },
      },
      [
        { price: 100, saleId: 'a-sale', status: 'SOLD' },
        { price: 50, saleId: 'a-sale', status: 'SOLD' },
      ],
    )
    const page = await returnsListingPage()
    await waitFor(() => expect(page.soldAmount(40)).toBe('150,00 €'))

    const sheet = await page.printReturnSheet(40)

    expect(sheet).toMatch(/Montant à régler: 135,00 €/)
    expect(sheet).not.toMatch(/Chèque n°|Trop-perçu|Reste à régler/)
  })

  // The listing shows ten fiches a page and « Tous sélectionner » only ticks
  // those: the evening's button computes every fiche in the base at once,
  // except the one whose cheque is already written.
  it('computes every fiche at once, beyond the page on screen', async () => {
    for (let depositIndex = 20; depositIndex < 30; depositIndex++) {
      await givenDeposit(
        { depositIndex, seller: { lastName: `Vendeur ${depositIndex}` } },
        [{ price: 10, saleId: 'a-sale', status: 'SOLD' }],
      )
    }
    await givenDeposit(
      {
        depositIndex: 40,
        signatory: 'Léa Petit',
        checkId: '1042',
        seller: { lastName: 'Petit', firstName: 'Léa' },
      },
      [{ price: 50, saleId: 'a-sale', status: 'SOLD' }],
    )
    const page = await returnsListingPage()
    await waitFor(() =>
      expect(page.counters()).toEqual({
        toCompute: 12,
        ready: 0,
        processed: 1,
      }),
    )

    const question = await page.computeAll()
    expect(question.title).toBe('Calculer les retours des 12 fiches ?')
    await question.confirm()

    await page.toast('12 fiches calculées')
    expect(page.counters()).toEqual({ toCompute: 0, ready: 12, processed: 1 })
    const deposits = await local.deposits()
    expect(deposits.find((d) => d.depositIndex === 29)?.sellerAmount).toBe(9)
    expect(
      deposits.find((d) => d.depositIndex === 40)?.returnedCalculationDate,
    ).toBeUndefined()
  })

  it('computes nothing when the question is declined', async () => {
    const page = await returnsListingPage()
    await waitFor(() => expect(page.counters().toCompute).toBe(2))

    const question = await page.computeAll()
    await question.decline()

    expect(page.counters()).toEqual({ toCompute: 2, ready: 0, processed: 0 })
    expect(await local.outbox()).toEqual([])
  })

  it('computes every selected deposit and shows what each seller is owed', async () => {
    const page = await returnsListingPage()
    await waitFor(() => expect(page.counters().toCompute).toBe(2))

    // Nothing computed yet
    expect(page.returnStatus(12)).toBe('RETOUR A CALCULER')
    expect(page.soldAmount(12)).toBe('')

    await page.selectAll()
    await page.computeSelected()

    await waitFor(() => expect(page.soldAmount(12)).toBe('200,00 €'))
    expect(page.soldAmount(3)).toBe('200,00 €')
    expect(page.counters()).toEqual({ toCompute: 0, ready: 2, processed: 0 })
    expect(page.returnStatus(12)).toBe('PRÊT')
    expect(page.returnStatus(3)).toBe('PRÊT')

    const deposits = await local.deposits()
    expect(
      deposits.map((d) => [d.depositIndex, d.clubAmount, d.sellerAmount]),
    ).toEqual(
      expect.arrayContaining([
        [12, 20, 178],
        [3, 30, 170],
      ]),
    )
  })

  // DURAND (fiche 12) still owes the 2 € contribution and hands
  // them over at the return desk of till 1000. The volunteer marks it
  // settled; that evening, the admin counting this till's returns cash
  // expects those 2 €.
  it('marks a contribution settled on this till, which then expects its cash', async () => {
    const page = await returnsListingPage()
    await waitFor(() => expect(page.mustPayContribution(12)).toBe('Oui'))
    expect(page.mustPayContribution(3)).toBe('Non')
    expect(page.canMarkSettled(3)).toBe(false)

    await page.markSettled(12)

    await page.toast('Cotisation encaissée sur la caisse 1000')
    await waitFor(() => expect(page.mustPayContribution(12)).toBe('Soldé'))
    expect(page.canMarkSettled(12)).toBe(false)

    signedInAs('ADMIN')
    const control = await cashRegisterControlPage(
      '/returns/cash-register-control',
      'Contrôler les espèces (retours)',
    )
    await waitFor(() => expect(control.theoretical()).toBe(2))
  })

  // MARTIN (fiche 15) sold nothing and owes the 2 €
  // contribution. The volunteer computes the return, then MARTIN pays: the
  // other computers receive both, in that order.
  it('sends the computation and the settlement to the other computers', async () => {
    const { deposit } = await givenDeposit(
      {
        depositIndex: 15,
        contributionStatus: 'A_PAYER',
        contributionAmount: 2,
        seller: { lastName: 'Martin', firstName: 'Lucie' },
      },
      [{ price: 50 }],
    )
    const page = await returnsListingPage()
    await waitFor(() => expect(page.returnStatus(15)).toBe('RETOUR A CALCULER'))
    await page.select(15)
    await page.computeSelected()
    await waitFor(() => expect(page.returnStatus(15)).toBe('PRÊT'))
    expect(page.mustPayContribution(15)).toBe('Oui')

    await page.markSettled(15)
    await page.toast('Cotisation encaissée sur la caisse 1000')

    const outbox = await local.outbox()
    expect(
      outbox.map((op) => [op.collection, op.operation, op.recordId]),
    ).toEqual([
      ['deposits', 'update', deposit.id],
      ['deposits', 'update', deposit.id],
    ])
    expect(outbox[0].data).toMatchObject({
      returnedCalculationDate: expect.any(Date),
      soldAmount: 0,
      clubAmount: 0,
      dueContributionAmount: 0,
      sellerAmount: 0,
      contributionStatus: 'A_PAYER',
    })
    expect(outbox[1].data).toEqual({
      contributionStatus: 'SOLDE',
      contributionCollectWorkstationId: 1000,
    })
  })

  // MARTIN (fiche 15) left three articles: one sold, one still on the
  // shelf, one nowhere to be found. The return sheet says which one is
  // absent, and counts only the two others.
  it('prints the return sheet with the absent article marked, out of the count', async () => {
    await givenDeposit(
      {
        depositIndex: 15,
        seller: { lastName: 'Martin', firstName: 'Lucie' },
      },
      [
        { price: 50, saleId: 'a-sale', status: 'SOLD' },
        { price: 30, status: 'ABSENT' },
        { price: 20 },
      ],
    )
    const page = await returnsListingPage()
    await waitFor(() => expect(page.returnStatus(15)).toBe('RETOUR A CALCULER'))

    const sheet = await page.printReturnSheet(15)

    expect(sheet).toContain('Nb articles : 2')
    expect(sheet).toMatch(/50,00 € Vendu/)
    expect(sheet).toMatch(/30,00 € Absent/)
    expect(sheet).not.toMatch(/20,00 € (Vendu|Absent)/)
  })
})
