// Page object for the main menu (« / », « Menu principal »): one card per
// desk of the sale, and a warning when this computer has no till number.
import { expect } from 'vitest'
import type { User } from '@/test/screen.tsx'
import { openScreen, screen, waitFor } from '@/test/screen.tsx'

export const desks = ['Dépôts', 'Ventes', 'Retours'] as const
export type Desk = (typeof desks)[number]

export async function mainMenuPage() {
  const { user, router } = await openScreen('/')
  return mainMenu(user, () => router.state.location.pathname)
}

// The menu as found on screen, whichever way the volunteer got there (opened
// directly, or after signing in).
export async function mainMenu(user: User, pathname: () => string) {
  await screen.findByRole('heading', { name: 'Menu principal' })
  // The cards appear once the till number has been read from the local base.
  await screen.findByRole('button', { name: /^Dépôts/ })

  const page = {
    user,
    pathname,
    // The question above the desks, as written (spaces included).
    prompt: () => screen.getByText(/^Que souhaitez-vous faire/).textContent,
    card: (desk: Desk) =>
      screen.getByRole('button', { name: new RegExp(`^${desk}`) }),
    // The amber box, title and text, or null when it is not shown.
    configurationWarning(): { title: string; message: string } | null {
      const title = screen.queryByRole('heading', {
        name: 'Configuration requise',
      })
      if (!title) return null
      return {
        title: title.textContent.trim(),
        message: screen
          .getByText(/^Cet ordinateur/)
          .textContent.replace(/\s+/g, ' ')
          .trim(),
      }
    },
    async open(desk: Desk) {
      await user.click(page.card(desk))
      await waitFor(() => expect(pathname()).not.toBe('/'))
    },
    hasSettingsLink: () =>
      screen.queryByRole('button', { name: 'Configuration' }) !== null,
    hasReportsCard: () =>
      screen.queryByRole('button', { name: /^Bilan/ }) !== null,
  }
  return page
}
