// Page object for the return listing (/returns/listing, "Gérer les fiches
// retours"): the evening screen where the club works out what each seller
// is owed, then prints their return sheets.
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function returnsListingPage() {
  const { user: u, router } = await openScreen('/returns/listing')
  await screen.findByRole('heading', { name: 'Gérer les fiches retours' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // A deposit's row, found by its number in the "Identifiant" column
    // (the third cell: selection checkbox, contribution, number...).
    row(depositIndex: number) {
      const row = screen
        .getAllByRole('row')
        .find(
          (candidate) =>
            within(candidate).queryAllByRole('cell')[2]?.textContent.trim() ===
            String(depositIndex),
        )
      if (!row) throw new Error(`No row for deposit ${depositIndex}`)
      return row
    },
    // The cells as the volunteer reads them. Amounts are formatted with a
    // narrow no-break space ("200,00 €"), normalised here.
    rowText(depositIndex: number): Array<string> {
      return within(page.row(depositIndex))
        .getAllByRole('cell')
        .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim())
    },
    returnStatus(depositIndex: number) {
      return page.rowText(depositIndex)[5]
    },
    soldAmount(depositIndex: number) {
      return page.rowText(depositIndex)[6]
    },
    // "Fiches à calculer: 2  Fiches prêtes: 0  Fiches traitées: 0"
    counters() {
      const read = (label: string) =>
        Number(
          screen
            .getByText(new RegExp(`^${label}:`))
            .textContent.replace(/\D/g, ''),
        )
      return {
        toCompute: read('Fiches à calculer'),
        ready: read('Fiches prêtes'),
        processed: read('Fiches traitées'),
      }
    },
    async selectAll() {
      await u.click(screen.getByRole('checkbox', { name: 'Tous sélectionner' }))
    },
    async computeSelected() {
      await u.click(
        screen.getByRole('button', { name: 'Lancer le calcul des retours' }),
      )
    },
  }
  return page
}
