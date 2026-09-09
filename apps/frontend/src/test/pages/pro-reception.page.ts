// Page object for "Réceptionner les articles des pros" (/deposits/pros):
// the desk where a professional's articles are checked in, scanned one
// category at a time.
import { expect } from 'vitest'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function proReceptionPage() {
  const { user: u, router } = await openScreen('/deposits/pros')
  await screen.findByRole('heading', {
    name: 'Réceptionner les articles des pros',
  })

  // The counts are read-only inputs next to a plain text label, not a
  // <label>: walk from the text to the input beside it.
  const countBeside = (label: string): number => {
    const input = screen.getByText(label).parentElement?.querySelector('input')
    if (!input) throw new Error(`No count next to "${label}"`)
    return Number(input.value)
  }

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- choosing the professional --------------------------------------
    // The volunteer types a fragment of the professional's name or its
    // deposit number, then picks the single match.
    async pickPro(search: string) {
      await u.click(screen.getByText(/Rechercher un professionel/))
      const popover = await screen.findByRole('dialog')
      await u.type(within(popover).getByRole('combobox'), search)
      await u.click(
        await screen.findByRole('option', { name: new RegExp(search, 'i') }),
      )
      await u.click(screen.getByRole('button', { name: 'Valider' }))
      await screen.findByText("Nombre d'articles scannés")
    },

    // ---- scanning ------------------------------------------------------
    // A barcode scanner types the code and presses Enter.
    async scan(code: string) {
      const input = document.querySelector<HTMLInputElement>('#articleCode')
      if (!input) throw new Error('No scan input on the screen')
      await u.clear(input)
      await u.type(input, `${code}{Enter}`)
    },
    scanInput: () =>
      document.querySelector<HTMLInputElement>('#articleCode')?.value ?? '',

    scannedCount: () => countBeside("Nombre d'articles scannés"),
    totalCount: () => countBeside("Nombre d'articles total"),

    // ---- what the volunteer is told ------------------------------------
    async alert() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        message: within(box).getByRole('paragraph').textContent.trim(),
        dismiss: () => u.click(within(box).getByRole('button', { name: 'OK' })),
      }
    },
    isAlertOpen: () => screen.queryByRole('alertdialog') !== null,
    async lastToast(text: string) {
      return screen.findByText(text)
    },

    // ---- the two lists ---------------------------------------------------
    async showReceived() {
      await u.click(screen.getByRole('radio', { name: 'Réceptionnés' }))
    },
    async showPending() {
      await u.click(screen.getByRole('radio', { name: 'Non réceptionnés' }))
    },
    // Rows of the table below, in the order they are displayed:
    // [code, discipline, category, brand, ...].
    rows(): Array<Array<string>> {
      return (
        screen
          .queryAllByRole('row')
          .map((row) =>
            within(row)
              .queryAllByRole('cell')
              .map((cell) => cell.textContent.replace(/\s+/g, ' ').trim()),
          )
          // An empty table renders a single "Aucun résultat" cell spanning
          // every column; only real rows have one cell per column.
          .filter((cells) => cells.length > 1)
      )
    },
    listedCodes: () => page.rows().map((cells) => cells[0]),
    listedCategories: () => page.rows().map((cells) => cells[2]),
    async listShows(codes: Array<string>) {
      await waitFor(() => expect(page.listedCodes()).toEqual(codes))
    },
  }
  return page
}
