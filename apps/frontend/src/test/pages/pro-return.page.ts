// Page object for "Retourner les articles des pros" (/returns/pros): the
// desk where what a professional did not sell is scanned back to them.
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function proReturnPage() {
  const { user: u, router } = await openScreen('/returns/pros')
  await screen.findByRole('heading', {
    name: 'Retourner les articles des pros',
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
    async pickPro(search: string) {
      await u.click(screen.getByText(/Rechercher un professionnel/))
      const popover = await screen.findByRole('dialog')
      await u.type(within(popover).getByRole('combobox'), search)
      await u.click(
        await screen.findByRole('option', { name: new RegExp(search, 'i') }),
      )
      await u.click(screen.getByRole('button', { name: 'Valider' }))
      await screen.findByText("Nombre d'articles scannés")
    },

    // ---- scanning --------------------------------------------------------
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
    toReturnCount: () => countBeside("Nombre d'articles à retourner"),

    // ---- what the volunteer is told -------------------------------------
    async alert() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        message: within(box).getByRole('paragraph').textContent.trim(),
        dismiss: () => u.click(within(box).getByRole('button', { name: 'OK' })),
      }
    },
    isAlertOpen: () => screen.queryByRole('alertdialog') !== null,
    lastToast: (text: string) => screen.findByText(text),

    // ---- the two lists ---------------------------------------------------
    async showScanned() {
      await u.click(screen.getByRole('radio', { name: 'Déjà scannés' }))
    },
    async showToScan() {
      await u.click(screen.getByRole('radio', { name: 'En attente de scan' }))
    },
    // The article codes of the open list, in the order displayed.
    listedCodes(): Array<string> {
      return screen
        .queryAllByRole('row')
        .map((row) => within(row).queryAllByRole('cell')[0]?.textContent ?? '')
        .filter((code) => /^\d{4} /.test(code))
    },
  }
  return page
}
