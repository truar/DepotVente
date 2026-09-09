import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { returnsListingPage } from '@/test/pages/returns-listing.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// The evening: the club runs the calculation over every deposit at once,
// and the listing shows each seller what is owed.
describe('Screen: the return listing', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    // A private seller who sold 200 € and still owes his 2 € contribution
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
})
