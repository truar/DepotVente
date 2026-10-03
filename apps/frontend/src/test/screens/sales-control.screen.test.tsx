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

  // Coins included, what was taken in and the difference are amounts of
  // money: shown and saved to the cent.
  it('counts the coins to the cent, as shown and as saved', async () => {
    const page = await salesControlPage()
    await page.open('drawer')
    await waitFor(() => expect(page.theoretical()).toBe(170))
    await page.count(50, 4)
    await page.count(20, 2)
    await page.count(5, 2)
    await page.count(2, 3)
    await page.count(0.5, 1)
    await page.count(0.01, 3)

    expect(page.realText()).toBe('176,53')
    expect(page.differenceText()).toBe('6,53')

    await page.comment('Pièces comptées')
    await page.print()
    await page.save()
    await page.savedToast(2000)
    // What the other computers and the evening reports receive is to the
    // cent too: the real amount and the difference.
    const sent = (await local.outbox()).find(
      (op) => op.collection === 'cashRegisterControls',
    )
    expect(sent?.data).toMatchObject({
      realCashAmount: 176.53,
      difference: 6.53,
    })

    // Reopened, the count reads as it was saved
    const again = await salesControlPage()
    await again.open('drawer')
    await waitFor(() => expect(again.commentText()).toBe('Pièces comptées'))
    await waitFor(() => expect(again.theoretical()).toBe(170))
    expect(again.realText()).toBe('176,53')
    expect(again.differenceText()).toBe('6,53')
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

// A buyer does not always come back to the till that sold to them. The
// money leaves the drawer of the till that hands it over, so that is the
// till whose count has to carry it — whichever till rang the sale up.
describe('Screen: the till count when the refund was made elsewhere', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    // Sold on till 1000, 40 € handed back here in cash.
    const elsewhere = await givenSale({
      saleIndex: 1001,
      incrementStart: 1000,
      cashAmount: 100,
      buyer: { lastName: 'Blanc', firstName: 'Eva', city: 'Alby' },
    })
    await givenRefund(elsewhere.sale, { incrementStart: 2000, cashAmount: 40 })
    // Sold here on the card, 50 € handed back on till 3000.
    const here = await givenSale({
      saleIndex: 2002,
      cashAmount: 0,
      cardAmount: 150,
      buyer: { lastName: 'Roche', firstName: 'Marc', city: 'Rumilly' },
    })
    await givenRefund(here.sale, { incrementStart: 3000, cardAmount: 50 })
  })

  it('lists the refunds this till handed over, whatever sale they belong to', async () => {
    const page = await salesControlPage()
    await page.open('refunds')

    await waitFor(() => expect(page.rows()).toHaveLength(1))
    expect(page.rows()[0]).toEqual([
      '1001',
      'Blanc Eva',
      '0633333333',
      'Alby',
      'CASH',
      'Article rendu',
      '100,00 €',
      '40,00 €',
    ])
    expect(page.total()).toBe('40,00 €')
  })

  it('takes the money out of this drawer, and leaves the other till its own', async () => {
    const page = await salesControlPage()
    await page.open('cashSales')

    // No cash sale of this till, and 40 € handed back for till 1000's sale
    await waitFor(() => expect(page.rows()).toHaveLength(1))
    expect(page.rows()[0].slice(0, 1).concat(page.rows()[0].slice(5))).toEqual([
      '1001',
      '-40,00 €',
    ])
    await page.open('drawer')
    await waitFor(() => expect(page.theoretical()).toBe(-40))
  })

  it('leaves the card refund made on another till out of this count', async () => {
    const page = await salesControlPage()
    await page.open('card')

    // The 150 € sale only: till 3000 handed the 50 € back, not this one
    await waitFor(() => expect(page.rows()).toHaveLength(1))
    expect(page.rows()[0][0]).toBe('2002')
    expect(page.total()).toBe('150,00 €')
  })
})

// A buyer brings back boots paid by card and is credited 50 € on their card
// at this very till. That money goes out through this till's card terminal:
// the card section of its count must show it, as money out.
describe('Screen: a card refund handed over by this till', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { sale } = await givenSale({
      saleIndex: 2002,
      cashAmount: 0,
      cardAmount: 150,
      totalRefundAmount: 50,
      buyer: { lastName: 'Roche', firstName: 'Marc', city: 'Rumilly' },
    })
    await givenRefund(sale, { incrementStart: 2000, cardAmount: 50 })
  })

  it('shows as a negative line under « Cartes bancaires »', async () => {
    const page = await salesControlPage()
    await page.open('card')

    await waitFor(() => expect(page.rows()).toHaveLength(2))
    // The sale, then the refund on the same sale number
    expect(page.rows().map((cells) => [cells[0], cells[5]])).toEqual([
      ['2002', '150,00 €'],
      ['2002', '-50,00 €'],
    ])
    expect(page.total()).toBe('100,00 €')
  })
})

// The volunteer counts the drawer and validates, then finds a forgotten
// 10 € note and counts again. There is one drawer, so one count: the second
// one replaces the first, here and on the other computers.
describe('Screen: counting the till a second time', () => {
  beforeEach(async () => {
    signedInAs()
    await givenTheSalesOfTill2000()
  })

  it('updates the saved count instead of adding another one', async () => {
    const first = await salesControlPage()
    await first.open('drawer')
    await waitFor(() => expect(first.theoretical()).toBe(170))
    await first.count(50, 3)
    await first.comment('Premier comptage')
    await first.print()
    await first.save()
    await first.savedToast(2000)

    const second = await salesControlPage()
    await second.open('drawer')
    await waitFor(() => expect(second.commentText()).toBe('Premier comptage'))
    expect(second.countOf(50)).toBe(3)
    await second.count(10, 1)
    await second.comment('Recompté, un billet de 10 oublié')
    await second.print()
    await second.save()
    await second.savedToast(2000)

    // Reopened, the screen shows the second count
    const reopened = await salesControlPage()
    await reopened.open('drawer')
    await waitFor(() =>
      expect(reopened.commentText()).toBe('Recompté, un billet de 10 oublié'),
    )
    expect(reopened.countOf(50)).toBe(3)
    expect(reopened.countOf(10)).toBe(1)
    // 160 € in the drawer, less the 80 € float
    expect(reopened.real()).toBe(80)

    // The other computers receive one control: created, then updated
    const sent = (await local.outbox()).map((op) => ({
      collection: op.collection,
      operation: op.operation,
      recordId: op.recordId,
    }))
    expect(sent.map((op) => [op.collection, op.operation])).toEqual([
      ['cashRegisterControls', 'create'],
      ['cashRegisterControls', 'update'],
    ])
    expect(sent[1].recordId).toBe(sent[0].recordId)
  })
})

// Two cash sales with cents on till 2000: 10,10 € and 20,20 €. Added up in
// floating point they make 30.299999999999997; the volunteer reads 30,30.
describe('Screen: the till count with amounts in cents', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    await givenSale({ saleIndex: 2001, cashAmount: 10.1 })
    await givenSale({ saleIndex: 2002, cashAmount: 20.2 })
  })

  it('shows the theoretical amount and the difference to the cent, the French way', async () => {
    const page = await salesControlPage()
    await page.open('drawer')

    await waitFor(() => expect(page.theoretical()).toBe(30.3))
    expect(page.theoreticalText()).toBe('30,30')

    await page.setFloat(0)
    await page.count(20, 1)
    await page.count(10, 1)
    expect(page.differenceText()).toBe('-0,30')
  })

  // The same count as on the deposit and return tills: totals as counted,
  // and the till found short by 30 cents.
  it('shows the totals as counted and finds the till short', async () => {
    const page = await salesControlPage()
    await page.open('drawer')
    await waitFor(() => expect(page.theoretical()).toBe(30.3))

    await page.setFloat(0)
    await page.count(20, 1)
    await page.count(10, 1)
    expect(page.notesTotal()).toBe('30,00 €')
    expect(page.coinsTotal()).toBe('0,00 €')
    expect(page.verdict()).toBe('Manque')
  })

  // « Montant réel » is what the drawer holds minus the float: the volunteer
  // counts the denominations, never types it.
  it('computes the real amount from the count, and does not let it be typed', async () => {
    const page = await salesControlPage()
    await page.open('drawer')
    await page.setFloat(0)
    await page.count(20, 1)
    await page.count(0.5, 1)
    expect(page.realText()).toBe('20,50')

    await page.typeReal('999')
    expect(page.realText()).toBe('20,50')
    expect(page.real()).toBe(20.5)
  })
})
