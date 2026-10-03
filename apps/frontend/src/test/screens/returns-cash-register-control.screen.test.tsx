import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { returnsListingPage } from '@/test/pages/returns-listing.page.ts'
import {
  depositCashCountPage,
  returnsCashCountPage,
} from '@/test/pages/returns-cash-register-control.page.ts'
import { lastPrintedText } from '@/test/printed.ts'
import { screen, signedInAs, waitFor, within } from '@/test/screen.tsx'

// The evening count on return register 1000. The cash it holds is the
// contributions it collected when sellers came back for their return
// (status « Soldé », collected on this till); a contribution paid at the
// deposit is in the deposit register's drawer, not this one.
async function givenTheEveningOnRegister1000() {
  await givenWorkstation(1000)
  await givenDeposit({
    depositIndex: 21,
    contributionStatus: 'SOLDE',
    contributionAmount: 2,
    contributionCollectWorkstationId: 1000,
  })
  await givenDeposit({
    depositIndex: 22,
    contributionStatus: 'SOLDE',
    contributionAmount: 4,
    contributionCollectWorkstationId: 1000,
  })
  // Collected on the other return till
  await givenDeposit({
    depositIndex: 23,
    contributionStatus: 'SOLDE',
    contributionAmount: 6,
    contributionCollectWorkstationId: 2000,
  })
  // Paid at the deposit, on this very computer's number
  await givenDeposit({
    depositIndex: 24,
    incrementStart: 1000,
    contributionStatus: 'PAYE',
    contributionAmount: 8,
  })
  // Still owed
  await givenDeposit({
    depositIndex: 25,
    contributionStatus: 'A_PAYER',
    contributionAmount: 3,
  })
  // Settled here, then the fiche was deleted
  await givenDeposit({
    depositIndex: 26,
    contributionStatus: 'SOLDE',
    contributionAmount: 5,
    contributionCollectWorkstationId: 1000,
    deletedAt: new Date(),
  })
}

describe('Screen: return cash register control, what the drawer should hold', () => {
  beforeEach(() => {
    signedInAs('ADMIN')
  })

  it('expects the contributions settled on this till only', async () => {
    await givenTheEveningOnRegister1000()

    const page = await returnsCashCountPage()

    // The deposits come from a live query; the amount follows shortly.
    await waitFor(() => expect(page.theoretical()).toBe(6))
    expect(page.unattributedWarning()).toBeNull()
  })

  // At the return listing, the volunteer takes the 2 € still owed by
  // Camille Durand and clicks « Marquer soldé »: that cash is now expected
  // in this till's drawer.
  it('expects a contribution marked settled at the return listing of this computer', async () => {
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 31,
      contributionStatus: 'A_PAYER',
      contributionAmount: 2,
    })
    await givenDeposit({
      depositIndex: 32,
      contributionStatus: 'A_PAYER',
      contributionAmount: 7,
      seller: { lastName: 'Bon', firstName: 'Jean' },
    })
    const listing = await returnsListingPage()
    await listing.user.click(
      within(listing.row(31)).getByRole('button', { name: 'Marquer soldé' }),
    )
    await screen.findByText('Cotisation encaissée sur la caisse 1000')

    const page = await returnsCashCountPage()

    await waitFor(() => expect(page.theoretical()).toBe(2))
  })

  // A contribution settled with no till recorded (a fiche corrected by
  // hand, an older build) is in no till's expected amount: the screen warns
  // about it instead of letting it pass for a surplus.
  it('leaves out, and warns about, a contribution settled on no till', async () => {
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 21,
      contributionStatus: 'SOLDE',
      contributionAmount: 2,
      contributionCollectWorkstationId: 1000,
    })
    await givenDeposit({
      depositIndex: 27,
      contributionStatus: 'SOLDE',
      contributionAmount: 5,
    })

    const page = await returnsCashCountPage()

    await waitFor(() =>
      expect(page.unattributedWarning()).toBe(
        "1 cotisation(s) soldée(s) sans caisse d'encaissement (5,00 €) : ces cotisations ne sont comptées dans le montant théorique d'aucune caisse.",
      ),
    )
    await waitFor(() => expect(page.theoretical()).toBe(2))
  })
})

describe('Screen: return cash register control, counting the drawer', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenTheEveningOnRegister1000()
  })

  // Every note and coin from 200 € down to 1 cent has its box; the float
  // left in the drawer for the day is 80 € unless changed.
  it('offers every denomination from 200 € to 1 cent, and an 80 € float', async () => {
    const page = await returnsCashCountPage()

    expect(page.denominationLabels()).toEqual([
      '200',
      '100',
      '50',
      '20',
      '10',
      '5',
      '2',
      '1',
      '0.50',
      '0.20',
      '0.10',
      '0.05',
      '0.02',
      '0.01',
    ])
    expect(page.float()).toBe(80)
    expect(page.real()).toBe(-80)
  })

  // What was taken in is what is counted minus the float; the difference
  // is what was taken in minus what should have been. Both are amounts of
  // money: shown and saved to the cent, coins included.
  it('counts the drawer minus the float, and the difference follows', async () => {
    const page = await returnsCashCountPage()
    await waitFor(() => expect(page.theoretical()).toBe(6))
    expect(page.theoreticalText()).toBe('6,00')

    await page.count(50, 1)
    await page.count(20, 1)
    await page.count(5, 2)
    await page.count(2, 3)
    expect(page.real()).toBe(6)
    expect(page.difference()).toBe(0)

    await page.count(0.5, 1)
    await page.count(0.01, 3)
    expect(page.realText()).toBe('6,53')
    expect(page.differenceText()).toBe('0,53')

    await page.close([], 'Pièces comptées', 1000)
    // What the other computers and the evening reports receive is to the
    // cent too: the real amount and the difference.
    const [sent] = await local.outbox()
    expect(sent.data).toMatchObject({ realCashAmount: 6.53, difference: 0.53 })

    // Reopened, the count reads as it was saved
    const again = await returnsCashCountPage()
    await again.loaded()
    expect(again.realText()).toBe('6,53')
    expect(again.differenceText()).toBe('0,53')

    await again.setFloat(100)
    expect(again.realText()).toBe('-13,47')
    expect(again.differenceText()).toBe('-19,47')
  })

  // « Montant réel » is what the drawer holds minus the float: the volunteer
  // counts the denominations, never types it.
  it('computes the real amount from the count, and does not let it be typed', async () => {
    const page = await returnsCashCountPage()
    await page.setFloat(0)
    await page.count(20, 1)
    await page.count(0.5, 1)
    expect(page.realText()).toBe('20,50')

    await page.typeReal('999')
    expect(page.realText()).toBe('20,50')
    expect(page.real()).toBe(20.5)
  })

  // The admin closes the till: the count is printed, saved, and the screen
  // goes back to the returns menu with « Caisse 1000 enregistrée ». The
  // count is sent to the other computers, as a return register's count.
  it('saves the count as the return register’s, back to the menu, and sends it', async () => {
    const page = await returnsCashCountPage()
    await waitFor(() => expect(page.theoretical()).toBe(6))
    await page.count(50, 1)
    await page.count(20, 1)
    await page.count(10, 1)
    await page.count(2, 2)
    await page.comment('Il manque 2 €')

    await page.print()
    expect(await lastPrintedText()).toContain('Contrôle caisse retours')
    await page.save()

    await page.savedToast(1000)
    await waitFor(() => expect(page.pathname()).toBe('/returns'))
    const outbox = await local.outbox()
    expect(outbox.map((op) => [op.collection, op.operation])).toEqual([
      ['cashRegisterControls', 'create'],
    ])
    expect(outbox[0].data).toMatchObject({
      type: 'RETURN',
      cashRegisterId: 1000,
      initialAmount: 80,
      cash50: 1,
      cash20: 1,
      cash10: 1,
      cash2: 2,
      realCashAmount: 4,
      theoreticalCashAmount: 6,
      difference: -2,
      comment: 'Il manque 2 €',
    })
  })

  // Later in the evening the admin reopens the count: it comes back as it
  // was saved, and a correction updates the same count instead of adding a
  // second one.
  it('reopens the saved count, and saving again updates it', async () => {
    const first = await returnsCashCountPage()
    await waitFor(() => expect(first.theoretical()).toBe(6))
    await first.close(
      [
        [50, 1],
        [20, 1],
      ],
      'Premier comptage',
      1000,
    )

    const page = await returnsCashCountPage()
    await page.loaded()
    expect(page.countOf(50)).toBe(1)
    expect(page.countOf(20)).toBe(1)
    expect(page.countOf(10)).toBe(0)
    expect(page.float()).toBe(80)
    expect(page.commentText()).toBe('Premier comptage')
    expect(page.real()).toBe(-10)
    expect(page.theoretical()).toBe(6)
    expect(page.difference()).toBe(-16)

    // A 10 € note was found under the drawer
    await page.close([[10, 1]], 'Billet de 10 retrouvé', 1000)

    const again = await returnsCashCountPage()
    await waitFor(() =>
      expect(again.commentText()).toBe('Billet de 10 retrouvé'),
    )
    expect(again.countOf(50)).toBe(1)
    expect(again.countOf(20)).toBe(1)
    expect(again.countOf(10)).toBe(1)
    expect(again.real()).toBe(0)
    const outbox = await local.outbox()
    expect(outbox.map((op) => [op.collection, op.operation])).toEqual([
      ['cashRegisterControls', 'create'],
      ['cashRegisterControls', 'update'],
    ])
    expect(outbox[1].recordId).toBe(outbox[0].recordId)
  })

  // Computer 1000 served as both the deposit till and the return till: its
  // two drawers are counted apart, and saving one never touches the other.
  it('keeps the return count and the deposit count of the same till apart', async () => {
    const returns = await returnsCashCountPage()
    await waitFor(() => expect(returns.theoretical()).toBe(6))
    await returns.close([[50, 1]], 'Retours', 1000)

    const deposits = await depositCashCountPage()
    // Nothing saved yet for the deposit drawer: a blank count
    expect(deposits.countOf(50)).toBe(0)
    expect(deposits.commentText()).toBe('')
    await deposits.close([[20, 1]], 'Dépôts', 1000)

    const returnsAgain = await returnsCashCountPage()
    await returnsAgain.loaded()
    expect(returnsAgain.commentText()).toBe('Retours')
    expect(returnsAgain.countOf(50)).toBe(1)
    expect(returnsAgain.countOf(20)).toBe(0)

    const depositsAgain = await depositCashCountPage()
    await depositsAgain.loaded()
    expect(depositsAgain.commentText()).toBe('Dépôts')
    expect(depositsAgain.countOf(20)).toBe(1)
    expect(depositsAgain.countOf(50)).toBe(0)

    const outbox = await local.outbox()
    expect(
      outbox.map((op) => [op.collection, op.operation, op.data.type]),
    ).toEqual([
      ['cashRegisterControls', 'create', 'RETURN'],
      ['cashRegisterControls', 'create', 'DEPOSIT'],
    ])
  })
})
