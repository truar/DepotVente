import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { cashRegisterControlPage } from '@/test/pages/cash-register-control.page.ts'
import { returnsListingPage } from '@/test/pages/returns-listing.page.ts'
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
        seller: { lastName: 'Allo', firstName: 'Ski' },
      },
      [{ price: 200, saleId: 'a-sale', status: 'SOLD' }],
    )
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
})
