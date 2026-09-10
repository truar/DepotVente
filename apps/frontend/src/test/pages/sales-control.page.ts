// Page object for the till count at the end of the sale
// (/sales/sales-control, "Contrôler la caisse"): one section per payment
// method, plus the drawer count.
import { expect } from 'vitest'
import { cashCount } from '@/test/pages/cash-count.ts'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export const SECTIONS = {
  card: 'Cartes bancaires',
  cashSales: 'Espèces — détail des ventes',
  drawer: 'Espèces — contrôle de caisse',
  check: 'Chèques',
  deferred: 'Paiements différés',
  refunds: 'Remboursement',
} as const
export type Section = keyof typeof SECTIONS

export async function salesControlPage() {
  const { user: u, router } = await openScreen('/sales/sales-control')
  await screen.findByRole('heading', { name: 'Contrôler la caisse' })
  const drawer = cashCount(u)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- sections -------------------------------------------------------
    // Only one is open at a time, so a story opens what it reads.
    async open(section: Section) {
      await u.click(screen.getByRole('button', { name: SECTIONS[section] }))
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: SECTIONS[section] }),
        ).toHaveAttribute('aria-expanded', 'true'),
      )
    },
    // Rows of the open section's table, amounts normalised
    // ("200,00 €" with a narrow no-break space).
    rows(): Array<Array<string>> {
      return screen
        .queryAllByRole('row')
        .map((row) =>
          within(row)
            .queryAllByRole('cell')
            .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim()),
        )
        .filter((cells) => cells.length > 1)
    },
    // A row the screen highlights: the payment does not cover the sale.
    flaggedRows(): Array<Array<string>> {
      return screen
        .queryAllByRole('row')
        .filter((row) => row.className.includes('amber'))
        .map((row) =>
          within(row)
            .queryAllByRole('cell')
            .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim()),
        )
    },
    // "Total: 250,00 €" under the open section.
    total(): string {
      return screen
        .getByText(/^Total:/)
        .textContent.replace(/\s+/g, ' ')
        .replace('Total: ', '')
        .trim()
    },

    // ---- the drawer (inside the "contrôle de caisse" section) -----------
    count: drawer.count,
    setFloat: drawer.setFloat,
    countOf: drawer.countOf,
    float: drawer.float,
    real: drawer.real,
    theoretical: drawer.theoretical,
    difference: drawer.difference,

    // ---- comment, print, save (always visible) --------------------------
    comment: drawer.comment,
    commentText: drawer.commentText,
    errors(): Array<string> {
      return screen
        .queryAllByText(/obligatoire|^Merci/)
        .map((line) => line.textContent.trim())
    },
    async print() {
      const before = document.querySelectorAll('iframe').length
      await u.click(screen.getByRole('button', { name: 'Imprimer' }))
      await waitFor(
        () =>
          expect(document.querySelectorAll('iframe').length).toBe(before + 1),
        { timeout: 15_000 },
      )
    },
    async save() {
      await u.click(screen.getByRole('button', { name: 'Valider' }))
    },
    savedToast(cashRegisterId: number) {
      return screen.findByText(`Caisse ${cashRegisterId} enregistrée`)
    },
  }
  return page
}
