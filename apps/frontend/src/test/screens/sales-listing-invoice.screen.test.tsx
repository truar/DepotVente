import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db.ts'
import { givenDeposit, givenSale, givenWorkstation } from '@/test/harness.ts'
import { salesListingPage } from '@/test/pages/sales-listing.page.ts'
import { printedDocuments } from '@/test/printed.ts'
import { signedInAs } from '@/test/screen.tsx'

// Sale 2001: ALPHA Camille bought the 120 € article of deposit 12.
async function givenSale2001() {
  const { articles } = await givenDeposit({ depositIndex: 12 }, [
    { price: 120 },
  ])
  const { sale } = await givenSale({
    saleIndex: 2001,
    cashAmount: 120,
    buyer: { lastName: 'Alpha', firstName: 'Camille' },
  })
  await db.articles.update(articles[0].id, {
    saleId: sale.id,
    status: 'SOLD',
  })
}

// One sale's invoice, from its row of "Gérer les ventes": beside the
// pencil that edits the sale, an eye to read the invoice (on the older
// Windows PCs the print dialog is too small to), and a printer.
describe('Screen: a sale invoice from the sales list', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    await givenSale2001()
  })

  it('shows the invoice without printing it, then prints it from the preview', async () => {
    const page = await salesListingPage()
    await page.waitForSales(1)

    const preview = await page.previewInvoice(2001)

    expect(preview.title).toBe('Facture vente 2001')
    const shown = await preview.text()
    expect(shown).toContain('Facture N°2001')
    expect(shown).toContain('ALPHA Camille')
    expect(printedDocuments()).toBe(0)

    await preview.print()
  })

  it('prints the invoice directly from the printer beside the eye', async () => {
    const page = await salesListingPage()
    await page.waitForSales(1)

    const text = await page.printInvoice(2001)

    expect(text).toContain('Facture N°2001')
  })
})
