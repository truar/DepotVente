// Page object for "Liste des articles" (/deposits/articles): every article
// of the local base, narrowed down by seller and by the column filters,
// ticked and sent to the label printer; a scanned code opens its article.
import { expect } from 'vitest'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

// Cells of an article row, in column order (the deposit column that the
// seller filter works on is hidden): tick box, code, discipline, category,
// brand, description, color, size, price, status, edit link.
const CODE = 1
const STATUS = 9

export async function articlesListPage() {
  const { user: u, router } = await openScreen('/deposits/articles')
  await screen.findByRole('heading', { name: 'Liste des articles' })

  // The header row holding the column titles, and the one under it holding
  // their filters.
  const headerRows = () =>
    screen
      .getAllByRole('row')
      .filter((row) => within(row).queryAllByRole('columnheader').length > 0)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the list --------------------------------------------------------
    // Rows of the table, in the order they are displayed, cells as read.
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
    listedCodes: () => page.rows().map((cells) => cells[CODE]),
    listedStatuses: (): Record<string, string> =>
      Object.fromEntries(
        page.rows().map((cells) => [cells[CODE], cells[STATUS]]),
      ),
    async listShows(codes: Array<string>) {
      await waitFor(() => expect(page.listedCodes()).toEqual(codes))
    },

    // ---- narrowing it down -----------------------------------------------
    // The seller search above the table; the column filters below are
    // comboboxes too.
    sellerCombobox: () => screen.getAllByRole('combobox')[0],
    // The volunteer types a fragment of the seller's name or deposit
    // number, then picks the single match.
    async pickSeller(search: string) {
      await u.click(page.sellerCombobox())
      const popover = await screen.findByRole('dialog')
      await u.type(within(popover).getByRole('combobox'), search)
      await u.click(
        await screen.findByRole('option', { name: new RegExp(search, 'i') }),
      )
    },
    async pickAllSellers() {
      await u.click(page.sellerCombobox())
      await u.click(
        await screen.findByRole('option', { name: 'Tous les vendeurs' }),
      )
    },
    // A column filter, in the second header row, set to one of its values.
    async filterBy(title: string, value: string) {
      const [titles, filters] = headerRows()
      const column = within(titles)
        .getAllByRole('columnheader')
        .findIndex((cell) => cell.textContent.includes(title))
      if (column < 0 || !filters) throw new Error(`No filter on ${title}`)
      const cell = within(filters).getAllByRole('columnheader')[column]
      await u.click(within(cell).getByRole('combobox'))
      const listbox = await screen.findByRole('listbox')
      await u.click(within(listbox).getByRole('option', { name: value }))
    },

    // ---- ticking articles ------------------------------------------------
    tickBox: (code: string) =>
      screen.getByRole('checkbox', { name: `Sélectionner ${code}` }),
    async tick(code: string) {
      await u.click(page.tickBox(code))
    },
    // The box in the header ticks every article the filters leave.
    async tickAll() {
      await u.click(screen.getByRole('checkbox', { name: 'Tout sélectionner' }))
    },
    // "Imprimer les étiquettes (3)": the count of ticked articles.
    printButton: () =>
      screen.getByRole('button', { name: /^Imprimer les étiquettes/ }),
    ticked: () => {
      const match = /\((\d+)\)/.exec(page.printButton().textContent)
      return match ? Number(match[1]) : 0
    },

    // ---- printing --------------------------------------------------------
    // Asks before printing; answers the question.
    async printLabels() {
      await u.click(page.printButton())
      return page.question()
    },
    async question() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        confirm: () =>
          u.click(within(box).getByRole('button', { name: 'Oui' })),
        decline: () =>
          u.click(within(box).getByRole('button', { name: 'Non' })),
      }
    },

    // ---- opening an article ----------------------------------------------
    async openFromRow(code: string) {
      await u.click(screen.getByRole('link', { name: `Modifier ${code}` }))
      await screen.findByRole('heading', { name: 'Modifier un article' })
    },
    // A barcode scanner types the code and presses Enter.
    async scan(code: string) {
      await u.type(
        screen.getByPlaceholderText('Ex: 2026 1001A'),
        `${code}{Enter}`,
      )
    },
    searchField: () => screen.getByPlaceholderText('Ex: 2026 1001A'),

    // ---- what the volunteer is told ------------------------------------
    async alert() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        message: within(box).getByRole('paragraph').textContent.trim(),
        link: within(box).queryByRole('link')?.getAttribute('href') ?? null,
        dismiss: () => u.click(within(box).getByRole('button', { name: 'OK' })),
      }
    },
    async lastToast(text: string) {
      return screen.findByText(text)
    },
  }
  return page
}
