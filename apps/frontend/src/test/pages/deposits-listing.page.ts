// Page object for the deposits list (/deposits/listing, "Gérer les fiches
// des dépôts"): where a volunteer looks back at the deposits registered so
// far, their seller, how many articles they hold and what they owe.
import { expect } from 'vitest'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

// Cells of a deposit row, in column order (the deposit id column is
// hidden): selection checkbox, number, type, seller, article count,
// contribution status, contribution amount, articles amount, actions.
const NUMBER = 1

export async function depositsListingPage() {
  const { user: u, router } = await openScreen('/deposits/listing')
  await screen.findByRole('heading', { name: 'Gérer les fiches des dépôts' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // The rows holding a deposit; the empty table shows a single cell.
    rows() {
      return screen
        .getAllByRole('row')
        .filter((row) => within(row).queryAllByRole('cell').length > 2)
    },
    // The deposit numbers listed, in the order shown.
    depositNumbers(): Array<number> {
      return page
        .rows()
        .map((row) =>
          Number(within(row).getAllByRole('cell')[NUMBER].textContent.trim()),
        )
    },
    row(depositIndex: number) {
      const row = page
        .rows()
        .find(
          (candidate) =>
            within(candidate)
              .getAllByRole('cell')
              [NUMBER].textContent.trim() === String(depositIndex),
        )
      if (!row) throw new Error(`No row for deposit ${depositIndex}`)
      return row
    },
    // A deposit as its row reads. Amounts are formatted with a narrow
    // no-break space ("2,00 €"), normalised here.
    deposit(depositIndex: number) {
      const cells = within(page.row(depositIndex))
        .getAllByRole('cell')
        .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim())
      return {
        seller: cells[3],
        articleCount: Number(cells[4]),
        contributionStatus: cells[5],
        contributionAmount: cells[6],
        amount: cells[7],
      }
    },
    // The list fills from the local base, and each row counts its articles
    // on its own: wait until the deposits are there and counted.
    async waitForDeposits(count: number, timeout?: number) {
      await waitFor(
        () => {
          expect(page.rows()).toHaveLength(count)
          for (const row of page.rows()) {
            expect(within(row).getAllByRole('cell')[4].textContent).not.toBe('')
          }
        },
        { timeout },
      )
    },
  }
  return page
}
