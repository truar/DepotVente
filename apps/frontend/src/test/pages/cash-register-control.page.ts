// Page object for the cash count screen, shared by the deposit register
// (/deposits/cash-register-control, "Contrôler les espèces") and the
// return register. Denominations are addressed by their value: 50, 2,
// 0.1...
import { expect } from 'vitest'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

const DENOMINATIONS = [
  200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01,
] as const
export type Denomination = (typeof DENOMINATIONS)[number]

// Labels as the screen prints them: "50", "2", "0.50", "0.10".
const denominationLabel = (value: number) =>
  value < 1 ? value.toFixed(2) : String(value)

export async function cashRegisterControlPage(
  route = '/deposits/cash-register-control',
  title = 'Contrôler les espèces',
) {
  const { user: u, router } = await openScreen(route)
  await screen.findByRole('heading', { name: title })

  // Some monetary fields (the difference) carry a label without a bound
  // input; walk from the label to the input beside it in that case.
  const input = (label: string): HTMLInputElement => {
    const bound = screen.queryByLabelText<HTMLInputElement>(label)
    if (bound) return bound
    const field = screen.getByText(label).closest('[data-slot="field"]')
    const found = field?.querySelector('input')
    if (!found) throw new Error(`No input for "${label}"`)
    return found
  }
  const amount = (label: string) => Number(input(label).value)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the drawer ----------------------------------------------------
    async count(value: Denomination, n: number) {
      const field = input(denominationLabel(value))
      await u.clear(field)
      await u.type(field, String(n))
    },
    countOf(value: Denomination): number {
      return amount(denominationLabel(value))
    },
    async setFloat(euros: number) {
      const field = input('Fonds de caisse')
      await u.clear(field)
      await u.type(field, String(euros))
    },
    float: () => amount('Fonds de caisse'),
    real: () => amount('Montant réel'),
    // The text as shown, for what the volunteer actually reads.
    realText: () => input('Montant réel').value,
    theoretical: () => amount('Montant théorique'),
    difference: () => amount('Différence'),

    // ---- comment, print, save -------------------------------------------
    async comment(text: string) {
      const field = screen.getByLabelText('Commentaire')
      await u.clear(field)
      if (text) await u.type(field, text)
    },
    commentText: () =>
      screen.getByLabelText<HTMLTextAreaElement>('Commentaire').value,
    errors(): Array<string> {
      return screen
        .queryAllByText(/obligatoire|^Merci/)
        .map((line) => line.textContent.trim())
    },
    async print() {
      const before = document.querySelectorAll('iframe').length
      await u.click(screen.getByRole('button', { name: 'Imprimer' }))
      await waitFor(
        () =>
          expect(document.querySelectorAll('iframe').length).toBe(before + 1),
        { timeout: 15_000 },
      )
    },
    async save() {
      await u.click(screen.getByRole('button', { name: 'Valider' }))
    },
    savedToast(cashRegisterId: number) {
      return screen.findByText(`Caisse ${cashRegisterId} enregistrée`)
    },
    // A saved control is loaded into the form asynchronously.
    async loaded() {
      await waitFor(() => expect(page.commentText()).not.toBe(''))
    },
    async dialog() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        confirm: () =>
          u.click(within(box).getByRole('button', { name: 'Oui' })),
        decline: () =>
          u.click(within(box).getByRole('button', { name: 'Non' })),
      }
    },
  }
  return page
}
