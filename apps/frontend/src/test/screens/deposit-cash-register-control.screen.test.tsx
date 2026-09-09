import { beforeEach, describe, expect, it } from 'vitest'
import {
  givenCashRegisterControl,
  givenDeposit,
  givenWorkstation,
  local,
} from '@/test/harness.ts'
import { cashRegisterControlPage } from '@/test/pages/cash-register-control.page.ts'
import { lastPrintedText } from '@/test/printed.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// The evening count on deposit register 1000. The theoretical amount is
// what this register took in cash: the contributions marked paid on its
// own deposits.
async function givenTheDayOnRegister1000() {
  await givenWorkstation(1000)
  await givenDeposit({
    incrementStart: 1000,
    contributionStatus: 'PAYE',
    contributionAmount: 2,
  })
  await givenDeposit({
    incrementStart: 1000,
    contributionStatus: 'PAYE',
    contributionAmount: 4,
  })
  await givenDeposit({
    incrementStart: 1000,
    contributionStatus: 'A_PAYER',
    contributionAmount: 2,
  })
  await givenDeposit({
    incrementStart: 2000,
    contributionStatus: 'PAYE',
    contributionAmount: 6,
  })
}

describe('Screen: deposit cash register control', () => {
  beforeEach(async () => {
    signedInAs()
    await givenTheDayOnRegister1000()
  })

  it('expects the paid contributions of this register only', async () => {
    const page = await cashRegisterControlPage()

    // The deposits come from a live query; the amount follows shortly.
    await waitFor(() => expect(page.theoretical()).toBe(6))
    expect(page.float()).toBe(80)
    expect(page.real()).toBe(-80)
  })

  it('counts the drawer minus the float, and the difference follows', async () => {
    const page = await cashRegisterControlPage()

    await page.count(50, 1)
    await page.count(20, 1)
    await page.count(5, 2)
    await page.count(2, 3)
    expect(page.real()).toBe(6)
    expect(page.difference()).toBe(0)

    await page.setFloat(100)
    expect(page.real()).toBe(-14)
    expect(page.difference()).toBe(-20)
  })

  it('records a short drawer as such, with every denomination, then returns to the menu', async () => {
    const page = await cashRegisterControlPage()
    await page.count(50, 1)
    await page.count(20, 1)
    await page.count(10, 1)
    await page.count(2, 2)
    expect(page.real()).toBe(4)
    expect(page.difference()).toBe(-2)

    await page.comment('Il manque 2 €')
    await page.print()
    await page.save()
    await page.savedToast(1000)
    expect(page.pathname()).toBe('/deposits')

    const [control] = await local.cashRegisterControls()
    expect(control).toMatchObject({
      cashRegisterId: 1000,
      type: 'DEPOSIT',
      initialAmount: 80,
      realCashAmount: 4,
      theoreticalCashAmount: 6,
      difference: -2,
      totalAmount: 4,
      cash50: 1,
      cash20: 1,
      cash10: 1,
      cash2: 2,
      cash200: 0,
      cash100: 0,
      cash5: 0,
      cash1: 0,
      cash05: 0,
      cash001: 0,
      comment: 'Il manque 2 €',
    })
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([['cashRegisterControls', 'create']])
  })

  it('needs a comment and a printed report before it saves', async () => {
    const page = await cashRegisterControlPage()
    await page.count(50, 1)
    await page.count(20, 1)
    await page.count(10, 1)
    await page.count(5, 1)
    await page.count(1, 1)

    await page.save()
    expect(page.errors()).toEqual(['Le commentaire est obligatoire'])
    expect(await local.cashRegisterControls()).toEqual([])

    await page.comment('RAS')
    await page.save()
    expect(page.errors()).toEqual([
      "Merci d'imprimer le rapport avant de valider le contrôle",
    ])
    expect(await local.cashRegisterControls()).toEqual([])

    await page.print()
    await page.save()
    await page.savedToast(1000)
    expect(await local.cashRegisterControls()).toHaveLength(1)
  })

  // Sums of coins are done in floating point; the volunteer must still read
  // a clean amount.
  it('adds coins up to a clean amount', async () => {
    const page = await cashRegisterControlPage()
    await page.setFloat(0)
    await page.count(0.1, 3)
    await page.count(0.2, 1)

    expect(page.realText()).toBe('0.5')
    expect(page.difference()).toBe(-5.5)
  })

  it('prints the count, the float, and the three amounts', async () => {
    const page = await cashRegisterControlPage()
    await page.count(50, 1)
    await page.count(20, 1)
    await page.count(10, 1)
    await page.count(2, 2)
    await page.comment('Il manque 2 €')

    await page.print()

    const report = await lastPrintedText()
    expect(report).toContain('Contrôle caisse dépôts')
    expect(report).toContain('Caisse N° 1000')
    // One line per denomination, counted or not, then the totals
    expect(report).toContain('50 € 1 50,00 €')
    expect(report).toContain('20 € 1 20,00 €')
    expect(report).toContain('10 € 1 10,00 €')
    expect(report).toContain('5 € 0 0,00 €')
    expect(report).toContain('2 € 2 4,00 €')
    expect(report).toContain('0.01 € 0 0,00 €')
    expect(report).toContain('Total 84,00 €')
    expect(report).toContain('Fond de caisse 80,00 €')
    expect(report).toContain('Montant réel 4,00 €')
    expect(report).toContain('Montant théorique 6,00 €')
    expect(report).toContain('Différence -2,00 €')
    expect(report).toContain('Commentaire: Il manque 2 €')
  })
})

describe('Screen: reopening a saved deposit control', () => {
  beforeEach(async () => {
    signedInAs()
    await givenTheDayOnRegister1000()
    await givenCashRegisterControl({
      cashRegisterId: 1000,
      type: 'DEPOSIT',
      cash50: 1,
      cash20: 1,
      initialAmount: 80,
      realCashAmount: -10,
      theoreticalCashAmount: 6,
      difference: -16,
      totalAmount: -10,
      comment: 'Premier comptage',
    })
  })

  it('shows the saved count and recomputes the theoretical; saving again updates it', async () => {
    const page = await cashRegisterControlPage()
    await page.loaded()

    expect(page.countOf(50)).toBe(1)
    expect(page.countOf(20)).toBe(1)
    expect(page.float()).toBe(80)
    expect(page.commentText()).toBe('Premier comptage')
    expect(page.real()).toBe(-10)
    expect(page.theoretical()).toBe(6)

    // A 10 € note was found under the drawer
    await page.count(10, 1)
    expect(page.real()).toBe(0)
    await page.comment('Billet de 10 retrouvé')
    await page.print()
    await page.save()
    await page.savedToast(1000)

    const controls = await local.cashRegisterControls()
    expect(controls).toHaveLength(1)
    expect(controls[0]).toMatchObject({
      cash50: 1,
      cash20: 1,
      cash10: 1,
      realCashAmount: 0,
      theoreticalCashAmount: 6,
      difference: -6,
      comment: 'Billet de 10 retrouvé',
    })
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([['cashRegisterControls', 'update']])
  })
})
