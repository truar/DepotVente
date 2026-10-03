// Page object for "Retourner les articles des pros" (/returns/pros): at the
// end of the sale, the professional's unsold articles are scanned out and
// handed back.
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function returnsProsPage() {
  const { user: u, router } = await openScreen('/returns/pros')
  await screen.findByRole('heading', {
    name: 'Retourner les articles des pros',
  })

  // The counts are read-only fields, read by their label.
  const countBeside = (label: string): number =>
    Number(screen.getByLabelText<HTMLInputElement>(label).value)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- choosing the professional --------------------------------------
    // The volunteer types a fragment of the professional's name or its
    // deposit number, then picks the single match.
    async pickPro(search: string) {
      await u.click(page.proCombobox())
      const popover = await screen.findByRole('dialog')
      await u.type(within(popover).getByRole('combobox'), search)
      await u.click(
        await screen.findByRole('option', { name: new RegExp(search, 'i') }),
      )
      await screen.findByText("Nombre d'articles scannés")
    },
    // The search above the form; the article table below has its own
    // column filters, which are comboboxes too.
    proCombobox: () => screen.getAllByRole('combobox')[0],
    hasButton: (name: string) =>
      screen.queryByRole('button', { name }) !== null,
    // The professional the combobox shows, e.g. "4 - Jean Perrillat".
    selectedPro: () => page.proCombobox().textContent.trim(),

    // ---- scanning ------------------------------------------------------
    // A barcode scanner types the code and presses Enter.
    async scan(code: string) {
      const input = screen.getByLabelText('Scanner un article')
      await u.clear(input)
      await u.type(input, `${code}{Enter}`)
    },
    isScanOpen: () => screen.queryByLabelText('Scanner un article') !== null,
    // What is left in the scan field after a scan.
    scanInput: () =>
      screen.getByLabelText<HTMLInputElement>('Scanner un article').value,

    // ---- what the volunteer is told ------------------------------------
    // A refused scan stops the volunteer with an alert to acknowledge.
    async alert() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        message: within(box).getByRole('paragraph').textContent.trim(),
        dismiss: () => u.click(within(box).getByRole('button', { name: 'OK' })),
      }
    },
    isAlertOpen: () => screen.queryByRole('alertdialog') !== null,
    // An accepted scan is confirmed by a toast.
    toast: (text: string) => screen.findByText(text),

    returnedCount: () => countBeside("Nombre d'articles scannés"),
    toReturnCount: () => countBeside("Nombre d'articles à retourner"),

    // ---- the article list --------------------------------------------
    // "Liste articles": what was already scanned out (shown first), or what
    // is still waiting for its scan.
    async showPending() {
      await u.click(screen.getByRole('radio', { name: 'En attente de scan' }))
    },
    // The codes of the list, its first column.
    listedCodes: (): Array<string> =>
      screen
        .queryAllByRole('row')
        .map((row) =>
          within(row)
            .queryAllByRole('cell')
            .map((cell) => cell.textContent.trim()),
        )
        // An empty table renders a single "Aucun résultat" cell spanning
        // every column; only real rows have one cell per column.
        .filter((cells) => cells.length > 1)
        .map((cells) => cells[0]),
  }
  return page
}
