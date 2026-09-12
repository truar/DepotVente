// Page object for the cheque listing (/returns/checks, "Visualiser les
// chèques"): the evening screen that reviews every cheque written to a
// private seller, and exports them for the accountant.
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function returnsChecksPage() {
  const { user: u, router } = await openScreen('/returns/checks')
  await screen.findByRole('heading', { name: 'Visualiser les chèques' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // A deposit's row, found by its number in the "Identifiant" column.
    row(depositIndex: number) {
      const row = screen
        .getAllByRole('row')
        .find(
          (candidate) =>
            within(candidate).queryAllByRole('cell')[0]?.textContent.trim() ===
            String(depositIndex),
        )
      if (!row) throw new Error(`No row for deposit ${depositIndex}`)
      return row
    },
    rowText(depositIndex: number): Array<string> {
      return within(page.row(depositIndex))
        .getAllByRole('cell')
        .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim())
    },
    seller(depositIndex: number) {
      return page.rowText(depositIndex)[1]
    },
    collectedAt(depositIndex: number) {
      return page.rowText(depositIndex)[5]
    },
    amount(depositIndex: number) {
      return page.rowText(depositIndex)[6]
    },
    // "Nombre de chèques: 2" / "Montant réglé: 178,00 €"
    summary() {
      const read = (label: string) =>
        screen
          .getByText(new RegExp(`^${label}:`))
          .textContent.replace(/\s+/g, ' ')
          .split(':')[1]
          .trim()
      return { count: read('Nombre de chèques'), total: read('Montant réglé') }
    },
  }

  return page
}
