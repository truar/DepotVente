// Page object for the return register's cash count (/returns/cash-register-
// control, "Contrôler les espèces (retours)", admin only). The same screen
// counts the deposit register (/deposits/cash-register-control), opened
// with depositCashCountPage to check that the two counts of one till stay
// apart. Denominations are addressed by their value: 50, 2, 0.1...
import { expect } from 'vitest'
import { euros, plain } from '@/test/amounts.ts'
import { openScreen, screen, waitFor } from '@/test/screen.tsx'

export const DENOMINATIONS = [
  200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01,
] as const
export type Denomination = (typeof DENOMINATIONS)[number]

// Labels as the screen prints them: "50", "2", "0.50", "0.10".
export const denominationLabel = (value: number) =>
  value < 1 ? value.toFixed(2) : String(value)

export function returnsCashCountPage() {
  return cashCountPage(
    '/returns/cash-register-control',
    'Contrôler les espèces (retours)',
  )
}

export function depositCashCountPage() {
  return cashCountPage(
    '/deposits/cash-register-control',
    'Contrôler les espèces',
  )
}

async function cashCountPage(route: string, title: string) {
  const { user: u, router } = await openScreen(route)
  await screen.findByRole('heading', { name: title })

  const field = (label: string) =>
    screen.getByLabelText<HTMLInputElement>(label)
  // « Différence » is shown without a label bound to its box: it is the
  // read-only box right after « Montant théorique ».
  const differenceField = () => {
    const boxes = screen.getAllByRole<HTMLInputElement>('textbox')
    return boxes[boxes.indexOf(field('Montant théorique')) + 1]
  }
  const amount = (input: HTMLInputElement) => Number(input.value)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the drawer ----------------------------------------------------
    denominationLabels: () =>
      DENOMINATIONS.map(denominationLabel).filter(
        (label) => screen.queryByLabelText(label) !== null,
      ),
    async count(value: Denomination, n: number) {
      const input = field(denominationLabel(value))
      await u.clear(input)
      await u.type(input, String(n))
    },
    countOf: (value: Denomination) => amount(field(denominationLabel(value))),
    async setFloat(floatAmount: number) {
      const input = field('Fonds de caisse')
      await u.clear(input)
      await u.type(input, String(floatAmount))
    },
    float: () => amount(field('Fonds de caisse')),
    // The computed amounts are shown the French way, « -19,47 »: read
    // back as numbers, or as the text the volunteer reads.
    real: () => euros(field('Montant réel').value),
    realText: () => plain(field('Montant réel').value),
    // The volunteer tries to type an amount of their own over the count.
    async typeReal(text: string) {
      const input = field('Montant réel')
      // Over what is shown, as a select-all then typing would.
      await u.type(input, text, {
        initialSelectionStart: 0,
        initialSelectionEnd: input.value.length,
      })
    },
    theoretical: () => euros(field('Montant théorique').value),
    theoreticalText: () => plain(field('Montant théorique').value),
    difference: () => euros(differenceField().value),
    differenceText: () => plain(differenceField().value),

    // ---- comment, print, save -------------------------------------------
    async comment(text: string) {
      const input = screen.getByLabelText('Commentaire')
      await u.clear(input)
      if (text) await u.type(input, text)
    },
    commentText: () =>
      screen.getByLabelText<HTMLTextAreaElement>('Commentaire').value,
    // The banner about contributions settled on no known till.
    unattributedWarning: () =>
      screen
        .queryByText(/sans caisse d'encaissement/)
        ?.textContent.replace(/\s+/g, ' ')
        .trim() ?? null,
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
    // A saved count is loaded into the form asynchronously.
    async loaded() {
      await waitFor(() => expect(page.commentText()).not.toBe(''))
    },
    // Count, comment, print and save, as the volunteer closes the till.
    async close(
      counts: Array<[Denomination, number]>,
      comment: string,
      cashRegisterId: number,
    ) {
      for (const [value, n] of counts) await page.count(value, n)
      await page.comment(comment)
      await page.print()
      await page.save()
      await page.savedToast(cashRegisterId)
    },
  }
  return page
}
