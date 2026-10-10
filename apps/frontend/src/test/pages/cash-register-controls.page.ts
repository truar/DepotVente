// Page object for the administrators' list of cash counts, one per desk
// (/deposits/cash-register-controls, /sales/…, /returns/…): the nine tills,
// 1000 to 9000, each with the status of its count and a way into it.
import { expect } from 'vitest'
import { plain } from '@/test/amounts.ts'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export const CONTROL_LISTS = {
  deposits: {
    route: '/deposits/cash-register-controls',
    title: 'Contrôles caisses dépôts',
  },
  sales: {
    route: '/sales/cash-register-controls',
    title: 'Contrôles caisses ventes',
  },
  returns: {
    route: '/returns/cash-register-controls',
    title: 'Contrôles caisses retours',
  },
} as const
export type ControlDesk = keyof typeof CONTROL_LISTS

const openLink = (cashRegisterId: number) =>
  screen.getByRole('link', { name: `Ouvrir la caisse ${cashRegisterId}` })

export async function cashRegisterControlsPage(desk: ControlDesk) {
  const { route, title } = CONTROL_LISTS[desk]
  const { user: u, router } = await openScreen(route)
  await screen.findByRole('heading', { name: title })
  // The tills are listed once the counts have been read from the local base.
  await screen.findByRole('link', { name: 'Ouvrir la caisse 1000' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // One row per till: number, status, counted, difference, last update.
    rows(): Array<Array<string>> {
      return screen
        .queryAllByRole('row')
        .map((row) =>
          within(row)
            .queryAllByRole('cell')
            .slice(0, 5)
            .map((cell) => plain(cell.textContent)),
        )
        .filter((cells) => cells.length > 0)
    },
    row(cashRegisterId: number): Array<string> {
      const row = page.rows().find((cells) => cells[0] === `${cashRegisterId}`)
      if (!row) throw new Error(`No row for till ${cashRegisterId}`)
      return row
    },
    async open(cashRegisterId: number) {
      await u.click(openLink(cashRegisterId))
      await waitFor(() =>
        expect(page.pathname()).toBe(`${route}/${cashRegisterId}`),
      )
    },
  }
  return page
}
