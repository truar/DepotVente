// Page object for the "Paramètres" screen (/settings, administrators only):
// where an administrator sees how this computer's sync is doing (last
// synchronisation, operations waiting to be sent, operations the server
// refused), who this computer is for the server, and sets its cash register
// number.
//
// Actions do things; readers return what the administrator sees, and the
// story does the expecting.
import { expect } from 'vitest'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

// The white card holding a section title and what belongs to it. `hidden`
// also finds it behind a modal dialog (which hides the rest of the page
// from assistive technologies).
function card(title: string, hidden = false): HTMLElement {
  const heading = screen.getByRole('heading', { name: title, hidden })
  const box = heading.closest<HTMLElement>('.shadow')
  if (!box) throw new Error(`No card around "${title}"`)
  return box
}

// The value printed next to a label of the "Identité du poste" list.
function identityValue(label: string, hidden = false): string {
  const term = within(card('Identité du poste', hidden)).getByText(label)
  return term.nextElementSibling?.textContent.trim() ?? ''
}

export type RefusedOperation = {
  // "create · contacts · <record id>"
  what: string
  // "<date> · tentatives : 10 · MAX_RETRIES (HTTP 400)", from "tentatives".
  attempts: string
  error: string | null
}

// `behindDialog`: the screen is covered by a blocking dialog (the dataset
// reset one); the sync and identity readers still read what lies behind it.
export async function settingsPage({
  behindDialog = false,
}: { behindDialog?: boolean } = {}) {
  const hidden = behindDialog
  const { user: u, router } = await openScreen('/settings')
  await screen.findByRole('heading', { name: 'Paramètres', hidden })
  // The screen reads the local base through live queries, which show their
  // defaults (0 waiting, '—') until loaded. The device id exists once this
  // computer has talked to the server, as in every story here: once it is
  // shown, the screen has loaded.
  await waitFor(() =>
    expect(identityValue('Identifiant du poste', hidden)).not.toBe('—'),
  )

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- Synchronisation -------------------------------------------------
    // "Dernière synchronisation = <date>", or "Non synchonisé".
    lastSync(): string {
      return within(card('Synchronisation', hidden))
        .getByText(/Dernière synchronisation|Non synchonisé/)
        .textContent.replace(/\s+/g, ' ')
        .trim()
    },

    // ---- Identité du poste -----------------------------------------------
    deviceId: () => identityValue('Identifiant du poste', hidden),
    appVersion: () => identityValue("Version de l'application", hidden),
    datasetEpoch: () => identityValue('Epoch de la base serveur', hidden),
    waitingCount: () =>
      Number(identityValue("Opérations en attente d'envoi", hidden)),

    // ---- Outbox — opérations refusées ------------------------------------
    refusedOperations(): Array<RefusedOperation> {
      return within(card('Outbox — opérations refusées'))
        .queryAllByRole('listitem')
        .map((item) => {
          const lines = Array.from(item.querySelectorAll('span')).map((span) =>
            span.textContent.replace(/\s+/g, ' ').trim(),
          )
          const [what, details] = lines
          return {
            what,
            attempts: details.slice(details.indexOf('tentatives')),
            error: lines.length > 2 ? lines[2] : null,
          }
        })
    },
    noRefusedOperation(): boolean {
      return (
        within(card('Outbox — opérations refusées')).queryByText(
          'Aucune opération refusée.',
        ) !== null
      )
    },
    async retryRefused(index: number) {
      const buttons = within(card('Outbox — opérations refusées')).getAllByRole(
        'button',
        { name: 'Réessayer' },
      )
      const button = buttons.at(index)
      if (!button) throw new Error(`No refused operation ${index}`)
      await u.click(button)
    },

    // ---- Numéro de caisse ------------------------------------------------
    // "Numéro de caisse en cours: 1000"
    currentWorkstation(): number {
      return Number(
        within(card('Numéro de caisse'))
          .getByText(/Numéro de caisse en cours/)
          .textContent.replace(/\D/g, ''),
      )
    },
    workstationInput(): HTMLInputElement {
      return within(card('Numéro de caisse')).getByRole('textbox')
    },
    async typeWorkstation(value: string) {
      const input = page.workstationInput()
      await u.clear(input)
      if (value !== '') await u.type(input, value)
    },
    validateButton(): HTMLButtonElement {
      return within(card('Numéro de caisse')).getByRole('button', {
        name: 'Valider',
      })
    },
    async validateWorkstation() {
      await u.click(page.validateButton())
    },

    // ---- header and navigation -------------------------------------------
    // The "Caisse 1000" badge next to "Déconnexion", or null when this
    // computer has no number yet.
    workstationBadge(): string | null {
      return screen.queryByText(/^Caisse \d+$/)?.textContent ?? null
    },
    async backToMainMenu() {
      await u.click(
        screen.getByRole('link', { name: /Retour au menu principal/ }),
      )
      await screen.findByRole('heading', { name: 'Menu principal' })
    },
  }
  return page
}
