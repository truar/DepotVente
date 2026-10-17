// Page object for « Suivi en direct de la bourse » (/reports/live, admin
// only): four tiles, then the detail of the theoretical takings beside what
// came in, all as the balance would print them now.
import { plain } from '@/test/amounts.ts'
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function liveBalancePage() {
  const { user, router } = await openScreen('/reports/live')
  await screen.findByRole('article', { name: 'Articles vendus' })

  const page = {
    user,
    pathname: () => router.state.location.pathname,
    // A tile's figure and the lines under it, spaces made plain:
    // ['5 / 9', '55,56 %'].
    tile(name: string): Array<string> {
      const tile = screen.getByRole('article', { name })
      return [...tile.querySelectorAll('p')].map((p) => plain(p.textContent))
    },
    // Every line of a block, « Droits CMR » -> « 62,00 € ».
    lines(block: string): Record<string, string> {
      const section = screen.getByRole('region', { name: block })
      const lines: Record<string, string> = {}
      for (const row of within(section).getAllByRole('row')) {
        const label = within(row).getByRole('rowheader').querySelector('span')
        const value = within(row).getByRole('cell')
        lines[plain(label?.textContent ?? '')] = plain(value.textContent)
      }
      return lines
    },
    // « Dernière vente reçue à 14:31 · caisse 6000 », or « Aucune vente reçue ».
    lastSale: () =>
      plain(
        screen.getByText(/^(Dernière vente reçue|Aucune vente reçue)/)
          .textContent,
      ),
  }
  return page
}
