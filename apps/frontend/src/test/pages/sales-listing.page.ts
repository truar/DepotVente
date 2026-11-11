// Page object for the "Gérer les ventes" screen (/sales/listing): every sale
// of the local base, and a summary line under the table.
import { expect } from 'vitest'
import { lastPrintedText, printedDocuments } from '@/test/printed.ts'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function salesListingPage() {
  const { user: u, router } = await openScreen('/sales/listing')
  await screen.findByRole('heading', { name: 'Gérer les ventes' })

  // Where the sale number sits in a row: found from the headers, so that a
  // column added in front of it does not shift what the stories read.
  const numberColumn = () =>
    screen
      .getAllByRole('columnheader')
      .findIndex((header) => header.textContent.trim() === 'Identifiant')

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // The rows holding a sale; the empty table shows a single cell.
    rows() {
      return screen
        .queryAllByRole('row')
        .filter((row) => within(row).queryAllByRole('cell').length > 1)
    },
    // The sale numbers listed, in the table's order.
    saleIndexes(): Array<string> {
      const column = numberColumn()
      return page
        .rows()
        .map((row) =>
          within(row).getAllByRole('cell')[column].textContent.trim(),
        )
    },
    row(saleIndex: number) {
      const column = numberColumn()
      const row = page
        .rows()
        .find(
          (candidate) =>
            within(candidate)
              .getAllByRole('cell')
              [column].textContent.trim() === String(saleIndex),
        )
      if (!row) throw new Error(`No row for sale ${saleIndex}`)
      return row
    },
    // "Nombre de ventes: 3" under the table.
    salesCount(): number {
      return Number(
        screen.getByText(/^Nombre de ventes/).textContent.replace(/\D/g, ''),
      )
    },
    async search(text: string) {
      await u.type(screen.getByPlaceholderText('Rechercher...'), text)
    },
    async select(saleIndex: number) {
      await u.click(
        within(page.row(saleIndex)).getByRole('checkbox', {
          name: 'Sélectionner une ligne',
        }),
      )
    },
    async clickPrintSelected() {
      await u.click(
        screen.getByRole('button', {
          name: 'Imprimer les factures sélectionnées',
        }),
      )
    },
    async clickPrintAll() {
      await u.click(
        screen.getByRole('button', { name: 'Imprimer toutes les factures' }),
      )
    },
    // The invoices of the checked sales, in one document; its text.
    async printSelected(): Promise<string> {
      const before = printedDocuments()
      await page.clickPrintSelected()
      return page.printed(before)
    },
    // The invoices of every sale the table lists; its text.
    async printAll(): Promise<string> {
      const before = printedDocuments()
      await page.clickPrintAll()
      return page.printed(before)
    },
    async printed(before: number): Promise<string> {
      await waitFor(() => expect(printedDocuments()).toBe(before + 1), {
        timeout: 15_000,
      })
      return lastPrintedText()
    },
    errorDialog(): string | null {
      return screen.queryByRole('alertdialog')?.textContent ?? null
    },
    // The list fills from the local base: wait until the sales are there.
    async waitForSales(count: number) {
      await waitFor(() => expect(page.rows()).toHaveLength(count))
    },
  }
  return page
}
