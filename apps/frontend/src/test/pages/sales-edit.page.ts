// Page object for the "Modifier la vente" screen (/sales/$saleId/edit): the
// screen a volunteer opens when a buyer brings an article back and is given
// money for it.
import { openScreen, screen, within } from '@/test/screen.tsx'

type RefundEntry = { card?: number; cash?: number; comment?: string }

export async function salesEditPage(saleId: string) {
  const { user: u, router } = await openScreen(`/sales/${saleId}/edit`)
  await screen.findByRole('heading', { name: /^Modifier la vente/ })

  // The only table on the screen is the one of the articles; its first row
  // is the header.
  const articleRows = () => screen.getAllByRole('row').slice(1)
  const cells = (row: HTMLElement) =>
    within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent.trim())

  const field = (label: string) => {
    const block = screen.getByText(label).closest('[data-slot="field-content"]')
    if (!block) throw new Error(`No field "${label}" on the screen`)
    return within(block as HTMLElement).getByRole('textbox')
  }

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the articles of the sale ---------------------------------------
    articles(): Array<string> {
      return articleRows().map((row) => cells(row)[0])
    },
    // The buyer hands an article back: the line is struck from the sale.
    async returnArticle(code: string) {
      const row = articleRows().find((line) => cells(line)[0] === code)
      if (!row) throw new Error(`No article ${code} in this sale`)
      await u.click(within(row).getAllByRole('button')[0])
    },
    // "Montant total : 80€", under the article table.
    articlesTotal(): number {
      return Number(
        screen.getByText(/Montant total/).textContent.replace(/[^\d.]/g, ''),
      )
    },

    // ---- the refund ------------------------------------------------------
    // "Montant à rembourser": what the sale owes the buyer in all, this
    // visit included.
    amountToRefund(): number {
      return Number(
        (field('Montant à rembourser') as HTMLInputElement).value,
      )
    },
    // What the screen shows as already entered for the refund.
    refundEntered(): { card: string; cash: string; comment: string } {
      const value = (label: string) =>
        (field(label) as HTMLInputElement).value
      return {
        card: value('Remboursement CB'),
        cash: value('Remboursement espèce'),
        comment: value('Commentaire'),
      }
    },
    async refund(entry: RefundEntry) {
      const set = async (label: string, value?: number | string) => {
        if (value === undefined) return
        const input = field(label)
        await u.clear(input)
        if (String(value) !== '') await u.type(input, String(value))
      }
      await set('Remboursement CB', entry.card)
      await set('Remboursement espèce', entry.cash)
      await set('Commentaire', entry.comment)
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
