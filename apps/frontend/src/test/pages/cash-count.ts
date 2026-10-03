// The drawer count, shared by the three control screens (deposit, return
// and sales): fourteen denomination fields under « Billets » and « Pièces »,
// the float, and the three amounts read from them.
import type { User } from '@/test/screen.tsx'
import { euros, plain } from '@/test/amounts.ts'
import { screen } from '@/test/screen.tsx'

export const DENOMINATIONS = [
  200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01,
] as const
export type Denomination = (typeof DENOMINATIONS)[number]

// Labels as the screens print them, the French way: « 50 € », « 0,50 € ».
const denominationLabel = (value: number) =>
  value < 1 ? `${value.toFixed(2).replace('.', ',')} €` : `${value} €`

const input = (label: string) => screen.getByLabelText<HTMLInputElement>(label)

// The line shown under a field, tied to it as its description.
const descriptionOf = (field: HTMLElement) => {
  const id = field.getAttribute('aria-describedby')
  const line = id ? document.getElementById(id) : null
  if (!line) throw new Error(`No description for ${field.id}`)
  return plain(line.textContent)
}

// « Billets · 80,00 € » -> « 80,00 € ».
const groupTotal = (name: string) => {
  const group = screen.getByRole('group', { name: new RegExp(`^${name}`) })
  return plain(group.querySelector('legend')!.textContent)
    .replace(name, '')
    .replace('·', '')
    .trim()
}

export function cashCount(u: User) {
  const amount = (label: string) => Number(input(label).value)

  return {
    denominationLabels: () =>
      DENOMINATIONS.map(denominationLabel).filter(
        (label) => screen.queryByLabelText(label) !== null,
      ),
    async count(value: Denomination, n: number) {
      const field = input(denominationLabel(value))
      await u.clear(field)
      await u.type(field, String(n))
    },
    countOf: (value: Denomination) => amount(denominationLabel(value)),
    // « = 10,00 € » under the 5 € box counted twice.
    subtotalOf: (value: Denomination) =>
      descriptionOf(input(denominationLabel(value))),
    notesTotal: () => groupTotal('Billets'),
    coinsTotal: () => groupTotal('Pièces'),
    async setFloat(floatAmount: number) {
      const field = input('Fonds de caisse')
      await u.clear(field)
      await u.type(field, String(floatAmount))
    },
    float: () => amount('Fonds de caisse'),
    // The computed amounts are shown the French way, « -19,47 »: read
    // back as numbers, or as the text the volunteer reads.
    real: () => euros(input('Montant réel').value),
    realText: () => plain(input('Montant réel').value),
    // « Total compté 86,00 € moins le fonds de caisse »
    realExplanation: () => descriptionOf(input('Montant réel')),
    // The volunteer tries to type an amount of their own over the count.
    async typeReal(text: string) {
      const field = input('Montant réel')
      // Over what is shown, as a select-all then typing would.
      await u.type(field, text, {
        initialSelectionStart: 0,
        initialSelectionEnd: field.value.length,
      })
    },
    theoretical: () => euros(input('Montant théorique').value),
    theoreticalText: () => plain(input('Montant théorique').value),
    difference: () => euros(input('Différence').value),
    differenceText: () => plain(input('Différence').value),
    // « Juste », « Manque » or « Excédent », beside the difference.
    verdict: () => descriptionOf(input('Différence')),
    async comment(text: string) {
      const field = screen.getByLabelText('Commentaire')
      await u.clear(field)
      if (text) await u.type(field, text)
    },
    commentText: () =>
      screen.getByLabelText<HTMLTextAreaElement>('Commentaire').value,
  }
}
