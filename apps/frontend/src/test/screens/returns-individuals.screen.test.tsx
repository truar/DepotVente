import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { returnsChecksPage } from '@/test/pages/returns-checks.page.ts'
import { returnsIndividualsPage } from '@/test/pages/returns-individuals.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// Two private sellers sold something and wait for their cheque: Camille
// Durand (fiche 12) and Jean Bon (fiche 13).
describe('Screen: pick the fiche whose cheque is to be written', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 12,
      soldAmount: 200,
      sellerAmount: 178,
      seller: { lastName: 'Durand', firstName: 'Camille' },
    })
    await givenDeposit({
      depositIndex: 13,
      soldAmount: 25,
      sellerAmount: 22,
      seller: { lastName: 'Bon', firstName: 'Jean' },
    })
  })

  // Picking a fiche is enough: there is no "Valider" to press after it.
  it('shows the amounts of the fiche picked in the list', async () => {
    const page = await returnsIndividualsPage()
    expect(page.depositRow()).toBeNull()
    expect(page.hasButton('Valider')).toBe(false)

    await page.pickDeposit('Durand')

    expect(page.selectedDeposit()).toBe('12 - Camille Durand')
    expect(page.depositRow()).toEqual([
      '12',
      'Durand Camille',
      '200,00 €',
      '178,00 €',
      'cent soixante-dix-huit euros',
    ])
  })

  it('switches to another fiche picked in the list', async () => {
    const page = await returnsIndividualsPage()

    await page.pickDeposit('Durand')
    await page.pickDeposit('Bon')

    expect(page.selectedDeposit()).toBe('13 - Jean Bon')
    await waitFor(() => expect(page.depositRow()?.[0]).toBe('13'))
    expect(page.depositRow()?.[3]).toBe('22,00 €')
  })

  // Picking the open fiche a second time, by a slip of the hand, must not
  // close it.
  it('keeps the fiche open when it is picked again', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')

    await page.pickDeposit('Durand')

    expect(page.selectedDeposit()).toBe('12 - Camille Durand')
    expect(page.depositRow()?.[0]).toBe('12')
  })

  // Once its cheque is written, the fiche is done: the list empties, ready
  // for the next seller, and no longer offers it.
  it('empties the list once the cheque is written, and stops offering the fiche', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')
    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })
    await page.printCheque()

    await page.nextCheque()

    await waitFor(() => expect(page.depositRow()).toBeNull())
    expect(page.selectedDeposit()).toBe('Rechercher une fiche')
    expect(await page.offeredDeposits()).toEqual(['13 - Jean Bon'])

    // The cheque is listed for the evening review: Durand's fiche, cheque
    // n°1042 signed by Paul, for what she was owed.
    const checks = await returnsChecksPage()
    await waitFor(() => expect(checks.seller(12)).toBe('Durand Camille'))
    // [Numéro du chèque, Signature]
    expect(checks.rowText(12).slice(3, 5)).toEqual(['1042', 'Paul'])
    expect(checks.amount(12)).toBe('178,00 €')
  })
})
