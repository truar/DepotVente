import { beforeEach, describe, expect, it } from 'vitest'
import type { Sale } from '@/db.ts'
import { db } from '@/db.ts'
import {
  YEAR,
  givenDeposit,
  givenRefund,
  givenSale,
  givenWorkstation,
} from '@/test/harness.ts'
import { salesListingPage } from '@/test/pages/sales-listing.page.ts'
import { givenABrokenPdfWorker, givenPdfWorker } from '@/test/pdf-worker.ts'
import { printedDocuments } from '@/test/printed.ts'
import { signedInAs } from '@/test/screen.tsx'

// A sale of the articles of one deposit, to a buyer of its own.
async function givenASaleOf(
  saleIndex: number,
  buyerLastName: string,
  depositIndex: number,
  prices: Array<number>,
  overrides: Partial<Sale> = {},
) {
  const { articles } = await givenDeposit(
    { depositIndex },
    prices.map((price) => ({ price })),
  )
  const total = prices.reduce((acc, price) => acc + price, 0)
  const { sale } = await givenSale({
    saleIndex,
    cashAmount: total,
    buyer: { lastName: buyerLastName, firstName: 'Camille' },
    ...overrides,
  })
  await db.articles.bulkUpdate(
    articles.map((article) => ({
      key: article.id,
      changes: { saleId: sale.id, status: 'SOLD' as const },
    })),
  )
  return sale
}

const invoiceNumbers = (text: string) =>
  [...text.matchAll(/Facture N°(\d+)/g)].map((match) => Number(match[1]))

// Played on the real screen: "Gérer les ventes", where a volunteer looks
// back at the sales rung up so far.
describe('Screen: the sales list', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
  })

  it('lists every sale by number', async () => {
    await givenASaleOf(2002, 'Bravo', 13, [50])
    await givenASaleOf(2001, 'Alpha', 12, [120])
    const page = await salesListingPage()
    await page.waitForSales(2)

    expect(page.saleIndexes()).toEqual(['2001', '2002'])
    expect(page.salesCount()).toBe(2)
  })
})

// The invoices of several sales, reprinted from the list in one go: the
// same invoice as the one printed at the till, one per sale.
describe('Screen: the invoices printed from the sales list', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
  })

  it('prints the invoices of the checked sales only', async () => {
    await givenASaleOf(2001, 'Alpha', 12, [120, 80], {
      cashAmount: 150,
      cardAmount: 50,
    })
    await givenASaleOf(2002, 'Bravo', 13, [50])
    await givenASaleOf(2003, 'Charlie', 14, [30], {
      cashAmount: 0,
      checkAmount: 30,
    })
    const page = await salesListingPage()
    await page.waitForSales(3)

    await page.select(2001)
    await page.select(2003)
    const text = await page.printSelected()

    expect(invoiceNumbers(text)).toEqual([2001, 2003])
    expect(text).toContain('ALPHA Camille')
    expect(text).toContain(`${YEAR} 12A`)
    expect(text).toContain(`${YEAR} 12B`)
    expect(text).toContain('Total : 200,00 €')
    expect(text).toContain('Espèces : 150,00 €')
    expect(text).toContain('Carte : 50,00 €')
    expect(text).toContain('CHARLIE Camille')
    expect(text).toContain(`${YEAR} 14A`)
    expect(text).toContain('Chèque : 30,00 €')
    expect(text).not.toContain('BRAVO')
  })

  // The skis went back and the till handed 120 € over: the invoice shows
  // what the buyer kept and what they paid in the end, as the sale's own
  // page prints it.
  it('leaves out what was handed back', async () => {
    const { articles } = await givenDeposit({ depositIndex: 12 }, [
      { price: 120 },
      { price: 80 },
    ])
    const { sale } = await givenSale({
      saleIndex: 2001,
      cashAmount: 200,
      totalRefundAmount: 120,
      buyer: { lastName: 'Alpha' },
    })
    await db.articles.update(articles[1].id, {
      saleId: sale.id,
      status: 'SOLD',
    })
    await givenRefund(sale, { cashAmount: 120 })
    const page = await salesListingPage()
    await page.waitForSales(1)

    await page.select(2001)
    const text = await page.printSelected()

    expect(text).not.toContain(`${YEAR} 12A`)
    expect(text).toContain(`${YEAR} 12B`)
    expect(text).toContain('Total : 80,00 €')
    expect(text).toContain('Espèces : 80,00 €')
  })

  it('asks for a sale when none is checked', async () => {
    await givenASaleOf(2001, 'Alpha', 12, [120])
    const page = await salesListingPage()
    await page.waitForSales(1)

    await page.clickPrintSelected()

    expect(page.errorDialog()).toContain(
      'Veuillez sélectionner au moins une vente.',
    )
    expect(printedDocuments()).toBe(0)
  })

  // Twelve sales: the table shows ten, all twelve are printed.
  it('prints every sale of the list, beyond the page shown', async () => {
    for (let n = 1; n <= 12; n++) {
      await givenASaleOf(2000 + n, `Buyer${n}`, 10 + n, [10])
    }
    const page = await salesListingPage()
    await page.waitForSales(10)

    const text = await page.printAll()

    expect(invoiceNumbers(text)).toEqual(
      Array.from({ length: 12 }, (_, i) => 2001 + i),
    )
  })

  it('prints only the sales the search keeps', async () => {
    await givenASaleOf(2001, 'Alpha', 12, [120])
    await givenASaleOf(2002, 'Bravo', 13, [50])
    const page = await salesListingPage()
    await page.waitForSales(2)

    await page.search('Bravo')
    await page.waitForSales(1)
    const text = await page.printAll()

    expect(invoiceNumbers(text)).toEqual([2002])
  })

  // A day's invoices are hundreds of pages: rendered in the page, they froze
  // it (the spinner stopped) until the print dialog opened. The page hands
  // the invoices to the PDF worker and prints what it renders.
  it('renders the invoices away from the page', async () => {
    const worker = givenPdfWorker()
    await givenASaleOf(2001, 'Alpha', 12, [120])
    await givenASaleOf(2002, 'Bravo', 13, [50])
    const page = await salesListingPage()
    await page.waitForSales(2)

    const text = await page.printAll()

    expect(worker.rendered()).toEqual(['InvoicesPdf'])
    expect(invoiceNumbers(text)).toEqual([2001, 2002])
  })

  // Printing never depends on the worker: one that does not start leaves
  // the page to render the invoices, as it did before.
  it('prints the invoices all the same when the worker cannot start', async () => {
    givenABrokenPdfWorker()
    await givenASaleOf(2001, 'Alpha', 12, [120])
    await givenASaleOf(2002, 'Bravo', 13, [50])
    const page = await salesListingPage()
    await page.waitForSales(2)

    const text = await page.printAll()

    expect(invoiceNumbers(text)).toEqual([2001, 2002])
  })
})
