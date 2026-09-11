// What the two end-of-day reports make of a refund. Both read the refund
// records, and both book them on the till that handed the money over — not
// on the till that rang the sale up.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  givenCashRegisterControl,
  givenRefund,
  givenSale,
} from '@/test/harness.ts'
import { loadRecapVentesPdfData } from '@/pdf/load-recap-ventes-pdf-data.ts'
import { loadBilanPdfData } from '@/pdf/load-bilan-pdf-data.ts'

// Till 2000 sold 200 € in cash (sale 2001) and 100 € on the card (2002).
// Both buyers came back to till 3000, which handed back 120 € in cash and
// 40 € on the card. Till 3000 also sold 150 € in cash of its own, so it
// counted 30 € in its drawer at the end.
async function givenADayWithRefundsMadeOnAnotherTill() {
  const cashSale = await givenSale({
    saleIndex: 2001,
    cashAmount: 200,
    totalRefundAmount: 120,
    buyer: { lastName: 'Petit', firstName: 'Anna', city: 'Annecy' },
  })
  const cardSale = await givenSale({
    saleIndex: 2002,
    cashAmount: 0,
    cardAmount: 100,
    totalRefundAmount: 40,
    buyer: { lastName: 'Roche', firstName: 'Marc', city: 'Rumilly' },
  })
  await givenSale({
    saleIndex: 3001,
    incrementStart: 3000,
    cashAmount: 150,
    buyer: { lastName: 'Blanc', firstName: 'Eva', city: 'Alby' },
  })
  await givenRefund(cashSale.sale, { incrementStart: 3000, cashAmount: 120 })
  await givenRefund(cardSale.sale, { incrementStart: 3000, cardAmount: 40 })
  await givenCashRegisterControl({
    cashRegisterId: 2000,
    type: 'SALE',
    realCashAmount: 200,
  })
  await givenCashRegisterControl({
    cashRegisterId: 3000,
    type: 'SALE',
    realCashAmount: 30,
  })
}

describe('Report: the sales recap', () => {
  beforeEach(givenADayWithRefundsMadeOnAnotherTill)

  it('takes each refund off the till that handed the money over', async () => {
    const { data } = await loadRecapVentesPdfData()

    expect(data.sales).toEqual([
      {
        cashRegisterId: 2000,
        checks: 0,
        cards: 100,
        cash: 200,
        deferred: 0,
        collected: 300,
        sold: 300,
        diff: 0,
      },
      // Till 3000 handed back more on the card than it took: its card
      // column goes negative, which is how the refund leaves the books.
      {
        cashRegisterId: 3000,
        checks: 0,
        cards: -40,
        cash: 30,
        deferred: 0,
        collected: -10,
        sold: -10,
        diff: 0,
      },
    ])
    expect(data.salesTotal).toMatchObject({ cards: 60, cash: 230, diff: 0 })
  })

  it('lists one line per refund, under the till that paid it', async () => {
    const { data } = await loadRecapVentesPdfData()

    expect(data.refunds).toEqual([
      {
        cashRegisterId: 3000,
        saleIndex: 2001,
        refundCash: 120,
        refundCard: 0,
        total: 120,
      },
      {
        cashRegisterId: 3000,
        saleIndex: 2002,
        refundCash: 0,
        refundCard: 40,
        total: 40,
      },
    ])
    expect(data.refundsTotal).toEqual({
      refundCard: 40,
      refundCash: 120,
      total: 160,
    })
  })
})

describe('Report: the bourse balance', () => {
  beforeEach(givenADayWithRefundsMadeOnAnotherTill)

  it('counts the sales net of what was handed back', async () => {
    const { data } = await loadBilanPdfData()

    // Cards: 100 € taken, 40 € given back. Cash: what the two tills
    // actually counted. Both add up to the sales, refunds deducted:
    // (200 − 120) + (100 − 40) + 150.
    expect(data.collection).toMatchObject({
      totalCards: 60,
      totalCash: 230,
      totalChecks: 0,
      totalDeferred: 0,
      totalPayments: 290,
    })
    expect(data.sales.totalAmount).toBe(290)
  })
})
