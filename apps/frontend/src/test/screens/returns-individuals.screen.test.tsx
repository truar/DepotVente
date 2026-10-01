import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation } from '@/test/harness.ts'
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

  it('shows the amounts of the fiche picked in the list', async () => {
    const page = await returnsIndividualsPage()
    expect(page.depositRow()).toBeNull()

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
})
