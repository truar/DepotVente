// The drawer count, shared by the three control screens (deposit, return
// and sales): fourteen denomination fields, the float, and the three
// amounts read from them.
import type { User } from '@/test/screen.tsx'
import { screen } from '@/test/screen.tsx'

const DENOMINATIONS = [
  200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01,
] as const
export type Denomination = (typeof DENOMINATIONS)[number]

// Labels as the screens print them: "50", "2", "0.50", "0.10".
const denominationLabel = (value: number) =>
  value < 1 ? value.toFixed(2) : String(value)

// Some monetary fields (the difference) carry a label without a bound
// input; walk from the label to the input beside it in that case.
function input(label: string): HTMLInputElement {
  const bound = screen.queryByLabelText<HTMLInputElement>(label)
  if (bound) return bound
  const field = screen.getByText(label).closest('[data-slot="field"]')
  const found = field?.querySelector('input')
  if (!found) throw new Error(`No input for "${label}"`)
  return found
}

export function cashCount(u: User) {
  const amount = (label: string) => Number(input(label).value)

  return {
    async count(value: Denomination, n: number) {
      const field = input(denominationLabel(value))
      await u.clear(field)
      await u.type(field, String(n))
    },
    countOf: (value: Denomination) => amount(denominationLabel(value)),
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
    async comment(text: string) {
      const field = screen.getByLabelText('Commentaire')
      await u.clear(field)
      if (text) await u.type(field, text)
    },
    commentText: () =>
      screen.getByLabelText<HTMLTextAreaElement>('Commentaire').value,
  }
}
