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
    async fillCheque(cheque: { signatory: string; checkId: string }) {
      await u.type(
        screen.getByLabelText('Édition chèque signé par'),
        cheque.signatory,
      )
      const checkId = screen.getByLabelText('N° de chèque')
      await u.clear(checkId)
      await u.type(checkId, cheque.checkId)
    },
    // Typed one at a time, for the checks on what the form refuses. An
    // empty string leaves the field blank.
    async typeSignatory(text: string) {
      const field = screen.getByLabelText('Édition chèque signé par')
      await u.clear(field)
      if (text) await u.type(field, text)
    },
    async typeCheckId(text: string) {
      const field = screen.getByLabelText('N° de chèque')
      await u.clear(field)
      if (text) await u.type(field, text)
    },
    checkIdText: () =>
      screen.getByLabelText<HTMLInputElement>('N° de chèque').value,
    workstationText: () =>
      screen.getByLabelText<HTMLInputElement>('N° du poste').value,
    // The messages under the fields, e.g. "Le signataire est obligatoire".
    errors(): Array<string> {
      return screen
        .queryAllByText(/obligatoire/)
        .map((line) => line.textContent.trim())
    },
    // Asks for the print, whatever comes of it (a refused form prints
    // nothing).
    async askToPrint() {
      await u.click(screen.getByRole('button', { name: /mprimer le chèque$/ }))
    },
    // "Imprimer le chèque" before the print, "Réimprimer le chèque" after.
    printButtonLabel: () =>
      screen
        .getByRole('button', { name: /mprimer le chèque$/ })
        .textContent.trim(),
    printReminderShown: () =>
      screen.queryByText('Imprimez le chèque avant de valider') !== null,
    nextChequeButton: () =>
      screen.getByRole('button', {
        name: 'Valider et passer au chèque suivant',
      }),
    async printCheque() {
      const before = document.querySelectorAll('iframe').length
      await page.askToPrint()
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
