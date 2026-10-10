// The banner shown at the top of every page once a new build of the app has
// been downloaded on this computer and waits to take over: « Nouvelle version
// de l'application disponible », with « Mettre à jour ».
import type { User } from '@/test/screen.tsx'
import { screen, within } from '@/test/screen.tsx'

const NAME = "Nouvelle version de l'application"

function banner(): HTMLElement {
  return screen.getByRole('status', { name: NAME })
}

export const appUpdateBanner = {
  async shown(): Promise<HTMLElement> {
    return screen.findByRole('status', { name: NAME })
  },
  isShown(): boolean {
    return screen.queryByRole('status', { name: NAME }) !== null
  },
  // Its two lines: what is available, and what clicking will do.
  lines(): Array<string> {
    return Array.from(banner().querySelectorAll('p')).map((line) =>
      line.textContent.replace(/\s+/g, ' ').trim(),
    )
  },
  // The only button: « Mettre à jour », « Mise à jour… » once clicked.
  button(): HTMLButtonElement {
    return within(banner()).getByRole('button')
  },
  async update(user: User) {
    await user.click(screen.getByRole('button', { name: 'Mettre à jour' }))
  },
}
