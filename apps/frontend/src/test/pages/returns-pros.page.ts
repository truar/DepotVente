// Page object for "Retourner les articles des pros" (/returns/pros): at the
// end of the sale, the professional's unsold articles are scanned out and
// handed back.
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function returnsProsPage() {
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
    // The volunteer types a fragment of the professional's name or its
    // deposit number, then picks the single match.
    async pickPro(search: string) {
      await u.click(page.proCombobox())
      const popover = await screen.findByRole('dialog')
      await u.type(within(popover).getByRole('combobox'), search)
      await u.click(
        await screen.findByRole('option', { name: new RegExp(search, 'i') }),
      )
      await u.click(screen.getByRole('button', { name: 'Valider' }))
      await screen.findByText("Nombre d'articles scannés")
    },
    // The search above the form; the article table below has its own
    // column filters, which are comboboxes too.
    proCombobox: () => screen.getAllByRole('combobox')[0],
    // The professional the combobox shows, e.g. "4 - Jean Perrillat".
    selectedPro: () => page.proCombobox().textContent.trim(),

    // ---- scanning ------------------------------------------------------
    // A barcode scanner types the code and presses Enter.
    async scan(code: string) {
      const input = document.querySelector<HTMLInputElement>('#articleCode')
      if (!input) throw new Error('No scan input on the screen')
      await u.clear(input)
      await u.type(input, `${code}{Enter}`)
    },
    isScanOpen: () => document.querySelector('#articleCode') !== null,

    returnedCount: () => countBeside("Nombre d'articles scannés"),
    toReturnCount: () => countBeside("Nombre d'articles à retourner"),
  }
  return page
}
