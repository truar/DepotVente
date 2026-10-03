// The blocking dialog shown on every page once the server answered
// EPOCH_MISMATCH (its database was rebuilt since this computer last synced):
// « La base de données du serveur a été réinitialisée ». It explains what
// happened, warns about the writes that will be lost, and offers one way
// out: « Recharger depuis le serveur ».
import type { User } from '@/test/screen.tsx'
import { screen, within } from '@/test/screen.tsx'

const TITLE = 'La base de données du serveur a été réinitialisée'

export const datasetResetDialog = {
  async shown(): Promise<HTMLElement> {
    return screen.findByRole('alertdialog', { name: TITLE })
  },
  isShown(): boolean {
    return screen.queryByRole('alertdialog', { name: TITLE }) !== null
  },
  // "07/12/2026 15:30:00", as printed in "(détecté le …)".
  detectedOn(): string {
    const box = screen.getByRole('alertdialog', { name: TITLE })
    const text = within(box).getByText(/détecté le/).textContent
    return /détecté le\s+(.+?)\)/.exec(text.replace(/\s+/g, ' '))?.[1] ?? ''
  },
  // The red warning about unsent writes, or null when there are none.
  lostOperationsWarning(): string | null {
    const box = screen.getByRole('alertdialog', { name: TITLE })
    return (
      within(box).queryByText(
        /n'a pas pu être transmise|n'ont pas pu être transmises/,
      )?.textContent ?? null
    )
  },
  // The only button: « Recharger depuis le serveur », « Rechargement… »
  // while it runs.
  button(): HTMLButtonElement {
    const box = screen.getByRole('alertdialog', { name: TITLE })
    return within(box).getByRole('button')
  },
  async reload(user: User) {
    await user.click(
      screen.getByRole('button', { name: 'Recharger depuis le serveur' }),
    )
  },
}
