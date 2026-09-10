import { beforeEach, describe, expect, it } from 'vitest'
import {
  givenCashRegisterControl,
  givenRefund,
  givenSale,
  givenWorkstation,
  local,
} from '@/test/harness.ts'
import { salesControlPage } from '@/test/pages/sales-control.page.ts'
import { lastPrintedText } from '@/test/printed.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// The end of the sale on till 2000: three sales rung up here, one on
// another till, and 30 € handed back in cash.
async function givenTheSalesOfTill2000() {
  await givenWorkstation(2000)
  const cash = await givenSale({
    saleIndex: 2001,
    cashAmount: 200,
    buyer: { lastName: 'Petit', firstName: 'Anna', city: 'Annecy' },
  })
  const card = await givenSale({
    saleIndex: 2002,
    cashAmount: 0,
    cardAmount: 150,
    buyer: { lastName: 'Roche', firstName: 'Marc', city: 'Rumilly' },
  })
  // A sale split between cheque and deferred: neither covers it alone.
  const split = await givenSale({
    saleIndex: 2003,
    cashAmount: 0,
    checkAmount: 60,
    deferredAmount: 40,
    buyer: { lastName: 'Blanc', firstName: 'Eva', city: 'Alby' },
  })
  // Another till's sale: none of this belongs to till 2000.
  await givenSale({ saleIndex: 1001, incrementStart: 1000, cashAmount: 500 })
  await givenRefund(cash.sale, { cashAmount: 30 })
  return { cash, card, split }
}

describe('Screen: the till count at the end of the sale', () => {
  beforeEach(async () => {
    signedInAs()
    await givenTheSalesOfTill2000()
  })

  it('expects the cash taken on this till, less what was handed back', async () => {
    const page = await salesControlPage()
    await page.open('drawer')

    // 200 € taken in cash, 30 € refunded; the other till's 500 € is not here
    await waitFor(() => expect(page.theoretical()).toBe(170))
    expect(page.float()).toBe(80)
  })

  it('lists the card payments of this till with their buyer', async () => {
    const page = await salesControlPage()
    await page.open('card')

    await waitFor(() => expect(page.rows()).toHaveLength(1))
    expect(page.rows()[0]).toEqual([
      '2002',
      'Roche Marc',
      '0633333333',
      'Rumilly',
      '150,00 €',
      '150,00 €',
    ])
    expect(page.total()).toBe('150,00 €')
  })

  it('lists the cash sales, a refund showing as money out', async () => {
    const page = await salesControlPage()
    await page.open('cashSales')

    await waitFor(() => expect(page.rows()).toHaveLength(2))
    // The sale, then the refund on the same sale number
    expect(page.rows().map((cells) => [cells[0], cells[5]])).toEqual([
      ['2001', '200,00 €'],
      ['2001', '-30,00 €'],
    ])
    expect(page.total()).toBe('170,00 €')
  })

  it.each([
    ['check', '2003', '60,00 €'],
    ['deferred', '2003', '40,00 €'],
  ] as const)(
    'lists the %s payments with their total',
    async (section, saleIndex, amount) => {
      const page = await salesControlPage()
      await page.open(section)

      await waitFor(() => expect(page.rows()).toHaveLength(1))
      expect(page.rows()[0][0]).toBe(saleIndex)
      expect(page.rows()[0][5]).toBe(amount)
      expect(page.total()).toBe(amount)
    },
  )

  // A payment that does not cover its sale is highlighted, so the volunteer
  // can check the rest was taken another way.
  it('flags a payment that does not cover the whole sale', async () => {
    const page = await salesControlPage()
    await page.open('check')

    await waitFor(() => expect(page.rows()).toHaveLength(1))
    // 60 € on a cheque for a 100 € sale
    expect(page.flaggedRows()).toHaveLength(1)
    expect(page.flaggedRows()[0]).toEqual([
      '2003',
      'Blanc Eva',
      '0633333333',
      'Alby',
      '100,00 €',
      '60,00 €',
    ])

    // The card payment covers its sale exactly, so nothing is flagged
    await page.open('card')
    await waitFor(() => expect(page.rows()).toHaveLength(1))
    expect(page.flaggedRows()).toEqual([])
  })

  it('records the count as a sale control, needing a comment and the printed report', async () => {
    const page = await salesControlPage()
    await page.open('drawer')
    await waitFor(() => expect(page.theoretical()).toBe(170))
    await page.count(50, 5)
    expect(page.real()).toBe(170)
    expect(page.difference()).toBe(0)

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
    await page.savedToast(2000)
    expect(page.pathname()).toBe('/sales')

    const [control] = await local.cashRegisterControls()
    expect(control).toMatchObject({
      cashRegisterId: 2000,
      type: 'SALE',
      initialAmount: 80,
      theoreticalCashAmount: 170,
      realCashAmount: 170,
      difference: 0,
      cash50: 5,
      comment: 'RAS',
    })
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([['cashRegisterControls', 'create']])
  })

  it('prints every payment method on one report', async () => {
    const page = await salesControlPage()
    await page.open('drawer')
    await waitFor(() => expect(page.theoretical()).toBe(170))
    await page.count(50, 5)
    await page.comment('RAS')

    await page.print()

    const report = await lastPrintedText()
    expect(report).toContain('Contrôle caisse ventes N° 2000')
    // Each buyer appears under their payment method
    expect(report).toContain('Roche Marc')
    expect(report).toContain('Blanc Eva')
    expect(report).toContain('Petit Anna')
    expect(report).toContain('Montant théorique 170,00 €')
    expect(report).toContain('Commentaire: RAS')
  })
})

describe('Screen: reopening the till count', () => {
  beforeEach(async () => {
    signedInAs()
    await givenTheSalesOfTill2000()
  })

  it('shows the saved count, and a deposit count of the same register is left alone', async () => {
    // The same register number also has a deposit control: a different day
    // job, it must not be loaded here.
    await givenCashRegisterControl({
      cashRegisterId: 2000,
      type: 'DEPOSIT',
      cash100: 3,
      comment: 'Caisse de dépôt',
    })
    await givenCashRegisterControl({
      cashRegisterId: 2000,
      type: 'SALE',
      cash50: 2,
      initialAmount: 80,
      realCashAmount: 20,
      totalAmount: 20,
      theoreticalCashAmount: 170,
      comment: 'Premier comptage',
    })

    const page = await salesControlPage()
    await page.open('drawer')

    await waitFor(() => expect(page.commentText()).toBe('Premier comptage'))
    expect(page.countOf(50)).toBe(2)
    // Nothing of the deposit count of the same register number
    expect(page.countOf(100)).toBe(0)
    // The theoretical is recomputed from today's sales, not reloaded
    await waitFor(() => expect(page.theoretical()).toBe(170))
  })
})
