// Page object for the private sellers' return desk (/returns/individuals,
// "Retour"): the volunteer picks a fiche, prints its cheque and moves on to
// the next one.
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function returnsIndividualsPage() {
  const { user: u, router } = await openScreen('/returns/individuals')
  await screen.findByRole('heading', { name: 'Retour' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- choosing the fiche ----------------------------------------------
    // The volunteer types the seller's name or the deposit number, then
    // picks the match.
    async pickDeposit(search: string) {
      await u.click(page.depositCombobox())
      const popover = await screen.findByRole('dialog')
      await u.type(within(popover).getByRole('combobox'), search)
      await u.click(
        await screen.findByRole('option', { name: new RegExp(search, 'i') }),
      )
      await u.click(screen.getByRole('button', { name: 'Valider' }))
      await screen.findByRole('columnheader', { name: 'Montant dû' })
    },
    depositCombobox: () => screen.getAllByRole('combobox')[0],
    // The fiche the combobox shows, e.g. "12 - Camille Durand".
    selectedDeposit: () => page.depositCombobox().textContent.trim(),

    // ---- the fiche being paid --------------------------------------------
    // [Fiche, Nom, Montant vendu, Montant dû, Montant en lettres], or null
    // when no fiche is open.
    depositRow(): Array<string> | null {
      const header = screen.queryByRole('columnheader', { name: 'Montant dû' })
      const table = header?.closest('table')
      if (!table) return null
      const [row] = within(table)
        .getAllByRole('row')
        .filter((candidate) => within(candidate).queryAllByRole('cell').length)
      return within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim())
    },
  }
  return page
}
