// Page object for the private sellers' return desk (/returns/individuals,
// "Retour"): the volunteer picks a fiche, prints its cheque and moves on to
// the next one.
import { expect } from 'vitest'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

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
      await screen.findByRole('columnheader', { name: 'Montant dû' })
    },
    depositCombobox: () => screen.getAllByRole('combobox')[0],
    hasButton: (name: string) =>
      screen.queryByRole('button', { name }) !== null,
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

    // ---- the cheque --------------------------------------------------------
    // "Édition chèque signé par" and "N° de chèque": labels not bound to their
    // input, so walk from the text to the input beside it.
    async fillCheque(cheque: { signatory: string; checkId: string }) {
      const inputBeside = (label: string) => {
        const input = screen
          .getByText(label)
          .closest('[data-slot="field-content"]')
          ?.querySelector('input')
        if (!input) throw new Error(`No input next to "${label}"`)
        return input
      }
      await u.type(inputBeside('Édition chèque signé par'), cheque.signatory)
      const checkId = inputBeside('N° de chèque')
      await u.clear(checkId)
      await u.type(checkId, cheque.checkId)
    },
    async printCheque() {
      const before = document.querySelectorAll('iframe').length
      await u.click(screen.getByRole('button', { name: 'Imprimer le chèque' }))
      await waitFor(
        () =>
          expect(document.querySelectorAll('iframe').length).toBe(before + 1),
        { timeout: 15_000 },
      )
    },
    async nextCheque() {
      await u.click(
        screen.getByRole('button', {
          name: 'Valider et passer au chèque suivant',
        }),
      )
    },
    async offeredDeposits(): Promise<Array<string>> {
      await u.click(page.depositCombobox())
      await screen.findByRole('listbox')
      const names = screen
        .queryAllByRole('option')
        .map((option) => option.textContent.trim())
      await u.keyboard('{Escape}')
      return names
    },
  }
  return page
}
