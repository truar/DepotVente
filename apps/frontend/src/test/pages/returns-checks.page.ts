// Page object for the cheque listing (/returns/checks, "Visualiser les
// chèques"): the evening screen that reviews every cheque written to a
// private seller, and exports them for the accountant.
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

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
    checkId(depositIndex: number) {
      return page.rowText(depositIndex)[3]
    },
    amount(depositIndex: number) {
      return page.rowText(depositIndex)[6]
    },

    // ---- correcting a cheque number --------------------------------------
    hasEditButton(depositIndex: number) {
      return (
        within(page.row(depositIndex)).queryByRole('button', {
          name: 'Modifier le n° de chèque',
        }) !== null
      )
    },
    // « Modifier » on a row opens a box holding the cheque number.
    async edit(depositIndex: number) {
      await u.click(
        within(page.row(depositIndex)).getByRole('button', {
          name: 'Modifier le n° de chèque',
        }),
      )
      const box = await screen.findByRole('dialog')
      const input = within(box).getByLabelText<HTMLInputElement>('N° de chèque')
      const messages = () =>
        within(box)
          .queryAllByRole('alert')
          .map((alert) => alert.textContent.trim())
      // Saving looks the number up first: wait until the box has closed, or
      // says why it has not.
      const click = async (name: string) => {
        await u.click(within(box).getByRole('button', { name }))
        await waitFor(() => {
          if (page.isEditOpen() && messages().length === 0)
            throw new Error('The box is still open, with no message')
        })
      }
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        checkId: () => input.value,
        async type(checkId: string) {
          await u.clear(input)
          if (checkId) await u.type(input, checkId)
        },
        // The error or the warning shown in the box.
        messages,
        hasButton: (name: string) =>
          within(box).queryByRole('button', { name }) !== null,
        save: () => click('Enregistrer'),
        saveAnyway: () => click('Enregistrer quand même'),
        cancel: () =>
          u.click(within(box).getByRole('button', { name: 'Annuler' })),
      }
    },
    isEditOpen: () => screen.queryByRole('dialog') !== null,
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
