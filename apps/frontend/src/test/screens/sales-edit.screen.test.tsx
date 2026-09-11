import { beforeEach, describe, expect, it } from 'vitest'
import { db, type Sale } from '@/db.ts'
import {
  YEAR,
  givenDeposit,
  givenSale,
  givenWorkstation,
  local,
} from '@/test/harness.ts'
import { salesEditPage } from '@/test/pages/sales-edit.page.ts'
import { signedInAs } from '@/test/screen.tsx'

// A buyer paid 200 € cash on till 2000 for two articles: skis at 120 € and
// boots at 80 €.
async function givenASaleOfTwoArticles() {
  const { articles } = await givenDeposit({}, [
    { price: 120 },
    { price: 80, category: 'Chaussures', brand: 'Nordica' },
  ])
  const { sale } = await givenSale({ saleIndex: 2001, cashAmount: 200 })
  await db.articles.bulkUpdate(
    articles.map((article) => ({
      key: article.id,
      changes: { saleId: sale.id, status: 'SOLD' as const },
    })),
  )
  return { sale, skis: `${YEAR} 12A`, boots: `${YEAR} 12B` }
}

// What the screen does today when an article comes back. These stories are
// written against the behaviour as it stands, so that what the fix for
// multi-till refunds changes is visible in the diff.
describe('Screen: an article brought back and the money handed over', () => {
  let sale: Sale
  let skis: string
  let boots: string

  beforeEach(async () => {
    signedInAs()
    ;({ sale, skis, boots } = await givenASaleOfTwoArticles())
  })

  it('hands the money back: the article leaves the sale and the till owes it', async () => {
    await givenWorkstation(2000)
    const page = await salesEditPage(sale.id)
    expect(page.articles()).toEqual([skis, boots])

    await page.returnArticle(skis)
    expect(page.articlesTotal()).toBe(80)
    expect(page.amountToRefund()).toBe(120)

    await page.refund({ cash: 120, comment: 'Skis trop grands' })
    await page.save()
    await page.savedToast(2001)

    // The refund is booked on the till in front of the volunteer.
    expect(await local.refunds()).toMatchObject([
      {
        saleId: sale.id,
        incrementStart: 2000,
        cardAmount: 0,
        cashAmount: 120,
        comment: 'Skis trop grands',
        deletedAt: null,
      },
    ])
    // The sale keeps its payments and carries what was given back; the
    // article is back on the shelf, up for sale again.
    const [saved] = await local.sales()
    expect(saved).toMatchObject({ cashAmount: 200, totalRefundAmount: 120 })
    const returned = (await local.articles()).find((a) => a.code === skis)
    expect(returned).toMatchObject({ saleId: null, status: 'RECEPTION_OK' })
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([
      ['contacts', 'update'],
      ['sales', 'update'],
      ['refunds', 'create'],
      ['articles', 'update'],
      ['articles', 'update'],
    ])
  })

  it('shows the refund already handed over when the sale is opened again', async () => {
    await givenWorkstation(2000)
    const first = await salesEditPage(sale.id)
    await first.returnArticle(skis)
    await first.refund({ cash: 120, comment: 'Skis trop grands' })
    await first.save()
    await first.savedToast(2001)

    const second = await salesEditPage(sale.id)
    expect(second.articles()).toEqual([boots])
    expect(second.refundEntered()).toEqual({
      card: '0',
      cash: '120',
      comment: 'Skis trop grands',
    })
    // Nothing new is given back on this visit, so the sale still adds up.
    expect(second.amountToRefund()).toBe(120)
  })

  // TODAY'S BEHAVIOUR, AND THE BUG REPORTED: the sale carries a single
  // refund record. A second article brought back to another till lands on
  // the record of the till that refunded first, and that till's drawer is
  // the one missing the money.
  it('puts a second refund made on another till onto the first till', async () => {
    await givenWorkstation(2000)
    const first = await salesEditPage(sale.id)
    await first.returnArticle(skis)
    await first.refund({ cash: 120, comment: 'Skis trop grands' })
    await first.save()
    await first.savedToast(2001)

    await givenWorkstation(3000)
    const second = await salesEditPage(sale.id)
    await second.returnArticle(boots)
    // The whole refund of the sale has to be typed again, till 2000's
    // included, for the sale to add up.
    expect(second.amountToRefund()).toBe(200)
    await second.refund({ cash: 200, comment: 'Chaussures trop petites' })
    await second.save()
    await second.savedToast(2001)

    expect(await local.refunds()).toMatchObject([
      { incrementStart: 2000, cashAmount: 200 },
    ])
    const [saved] = await local.sales()
    expect(saved.totalRefundAmount).toBe(200)
  })

  it('refuses a refund that does not match what the sale owes', async () => {
    await givenWorkstation(2000)
    const page = await salesEditPage(sale.id)

    await page.returnArticle(skis)
    await page.refund({ cash: 100, comment: 'Skis trop grands' })
    await page.save()

    expect(page.errors()).toContain(
      'Les montants saisis sont incohérents. Vérifiez les règlements et remboursements.',
    )
    expect(await local.refunds()).toEqual([])
  })

  // Money out of the drawer without a word on why would leave a hole
  // nobody can explain at the till count.
  it('asks for a comment on the refund', async () => {
    await givenWorkstation(2000)
    const page = await salesEditPage(sale.id)

    await page.returnArticle(skis)
    await page.refund({ cash: 120 })
    await page.save()

    expect(page.errors()).toContain(
      'Merci de saisir un commentaire pour le remboursement',
    )
    expect(await local.refunds()).toEqual([])
  })

  // A refund can only be taken back by making the sale add up again: the
  // article is no longer in the sale, so its price has to come off the
  // payment. Clearing the refund on its own is refused.
  it('only takes a refund back when the payment is corrected with it', async () => {
    await givenWorkstation(2000)
    const first = await salesEditPage(sale.id)
    await first.returnArticle(skis)
    await first.refund({ cash: 120, comment: 'Skis trop grands' })
    await first.save()
    await first.savedToast(2001)

    const second = await salesEditPage(sale.id)
    await second.refund({ cash: 0 })
    await second.save()
    expect(second.errors()).toContain(
      'Les montants saisis sont incohérents. Vérifiez les règlements et remboursements.',
    )

    await second.pay({ cash: 80 })
    await second.save()
    await second.savedToast(2001)

    const [refund] = await local.refunds()
    expect(refund.deletedAt).not.toBeNull()
    // The sale still carries the 120 € as refunded, though: the amount is
    // the sum of the prices taken out of the sale, not of the refunds.
    const [saved] = await local.sales()
    expect(saved).toMatchObject({ cashAmount: 80, totalRefundAmount: 120 })
  })
})
