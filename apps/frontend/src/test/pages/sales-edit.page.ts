// Page object for the "Modifier la vente" screen (/sales/$saleId/edit): the
// screen a volunteer opens when a buyer brings an article back and is given
// money for it.
import { openScreen, screen, within } from '@/test/screen.tsx'

type RefundEntry = { card?: number; cash?: number; comment?: string }

export async function salesEditPage(saleId: string) {
  const { user: u, router } = await openScreen(`/sales/${saleId}/edit`)
  await screen.findByRole('heading', { name: /^Modifier la vente/ })

  const rowsOf = (table: string) =>
    within(screen.getByRole('table', { name: table }))
      .getAllByRole('row')
      .slice(1)
  const cells = (row: HTMLElement) =>
    within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent.trim())

  const field = (label: string) =>
    screen.getByLabelText<HTMLInputElement>(label)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the articles of the sale ---------------------------------------
    articles(): Array<string> {
      return rowsOf('Articles de la vente').map((row) => cells(row)[0])
    },
    // The buyer hands an article back: the line is struck from the sale.
    async returnArticle(code: string) {
      const row = rowsOf('Articles de la vente').find(
        (line) => cells(line)[0] === code,
      )
      if (!row) throw new Error(`No article ${code} in this sale`)
      await u.click(
        within(row).getByRole('button', { name: "Retirer l'article" }),
      )
    },
    // "Montant total : 80€", under the article table.
    articlesTotal(): number {
      return Number(
        screen.getByText(/Montant total/).textContent.replace(/[^\d.]/g, ''),
      )
    },

    // ---- the refunds -----------------------------------------------------
    // What the sale owes the buyer in all, this visit included, and what is
    // left to hand over once the lines are filled.
    amountToRefund(): number {
      return Number(field('Montant à rembourser').value)
    },
    remainingToRefund(): number {
      return Number(field('Reste à rembourser').value)
    },
    // One line per refund: those of the previous visits, on their own till,
    // then the empty line of the till in front of the volunteer.
    refunds(): Array<{
      caisse: string
      card: string
      cash: string
      comment: string
    }> {
      return rowsOf('Remboursements').map((row) => {
        const value = (label: string) =>
          within(row).getByLabelText<HTMLInputElement>(label).value
        return {
          caisse: cells(row)[0],
          card: value('Remboursement CB'),
          cash: value('Remboursement espèce'),
          comment: value('Commentaire du remboursement'),
        }
      })
    },
    async fillRefund(index: number, entry: RefundEntry) {
      const row = rowsOf('Remboursements').at(index)
      if (!row) throw new Error(`No refund line ${index} on the screen`)
      const set = async (label: string, value?: number | string) => {
        if (value === undefined) return
        const input = within(row).getByLabelText(label)
        await u.clear(input)
        if (String(value) !== '') await u.type(input, String(value))
      }
      await set('Remboursement CB', entry.card)
      await set('Remboursement espèce', entry.cash)
      await set('Commentaire du remboursement', entry.comment)
    },
    // The refund this till is handing over: the last line.
    async refund(entry: RefundEntry) {
      await page.fillRefund(rowsOf('Remboursements').length - 1, entry)
    },

    // ---- what the buyer paid --------------------------------------------
    async pay(amounts: {
      cash?: number
      card?: number
      check?: number
      deferred?: number
    }) {
      const set = async (label: string, amount?: number) => {
        if (amount === undefined) return
        const input = field(label)
        await u.clear(input)
        await u.type(input, String(amount))
      }
      await set('Montant espèces', amounts.cash)
      await set('Montant CB', amounts.card)
      await set('Montant chèque', amounts.check)
      await set('Montant différé', amounts.deferred)
    },

    // ---- errors and save -------------------------------------------------
    errors(): Array<string> {
      return screen
        .queryAllByRole('alert')
        .map((el) => el.textContent.trim())
        .filter((text) => text !== '')
    },
    async save() {
      await u.click(screen.getByRole('button', { name: 'Valider' }))
    },
    savedToast(saleIndex: number) {
      return screen.findByText(`Vente ${saleIndex} enregistré`)
    },
  }
  return page
}
