// Page object for the "Modifier la fiche" screen (/deposits/$depositId/edit):
// the screen a volunteer opens from the deposits list to correct a seller's
// details or the articles of a deposit already registered.
//
// Actions do things; readers return what the volunteer sees, and the story
// does the expecting. The article rows share their markup with the deposit
// form of /deposits/add (see deposit-add.page.ts).
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function depositEditPage(depositId: string) {
  const { user: u, router } = await openScreen(`/deposits/${depositId}/edit`)
  await screen.findByRole('heading', { name: /^Modifier la fiche n°/ })

  const page = {
    user: u,
    // Where the router is, e.g. after saving.
    pathname: () => router.state.location.pathname,

    // ---- article rows ------------------------------------------------
    // Rows of the articles table: the ones holding the category, brand and
    // discipline comboboxes (the colour datalist input counts as one too).
    articleRows() {
      return screen
        .getAllByRole('row')
        .filter((row) => within(row).queryAllByRole('combobox').length === 4)
    },
    articleRow(index: number) {
      const row = page.articleRows().at(index)
      if (!row) throw new Error(`No article row ${index}`)
      return row
    },
    // Short codes shown on the article rows, e.g. "12 A".
    articleCodes(): Array<string> {
      return screen
        .queryAllByDisplayValue<HTMLInputElement>(/^\d+ [A-Z]+$/)
        .map((input) => input.value)
    },
    async addArticle() {
      await u.click(
        screen.getByRole('button', { name: 'Ajouter un nouvel article' }),
      )
    },
    async fillArticle(
      index: number,
      article: Partial<{
        category: string
        brand: string
        discipline: string
        color: string
        size: string
        model: string
        price: string
      }>,
    ) {
      const row = page.articleRow(index)
      const comboboxes = within(row).getAllByRole('combobox')
      const [category, brand, discipline] = comboboxes.filter(
        (el) => el.tagName === 'BUTTON',
      )
      const color = comboboxes.find((el) => el.tagName === 'INPUT')
      if (!color) throw new Error('No colour input in the article row')
      // As a volunteer does: open, type to narrow the list, pick the match.
      const pick = async (combobox: HTMLElement, value: string) => {
        await u.click(combobox)
        const popover = await screen.findByRole('dialog')
        await u.type(within(popover).getByRole('combobox'), value)
        await u.click(await screen.findByRole('option', { name: value }))
      }
      if (article.category) await pick(category, article.category)
      if (article.brand) await pick(brand, article.brand)
      if (article.discipline) await pick(discipline, article.discipline)
      // Text inputs, in column order after the read-only code: size, model,
      // price.
      const [, size, model, price] = within(row).getAllByRole('textbox')
      if (article.color) await u.type(color, article.color)
      if (article.size) await u.type(size, article.size)
      if (article.model) await u.type(model, article.model)
      if (article.price) {
        await u.clear(price)
        await u.type(price, article.price)
      }
    },
    // On this screen every article is already saved: the bin strikes it
    // through instead of taking the line away.
    async removeArticle(index: number) {
      await u.click(
        within(page.articleRow(index)).getByRole('button', {
          name: "Supprimer l'article",
        }),
      )
    },
    async restoreArticle(index: number) {
      await u.click(
        within(page.articleRow(index)).getByRole('button', {
          name: "Restaurer l'article",
        }),
      )
    },
    isArticleDeleted(index: number) {
      return (
        within(page.articleRow(index)).queryByRole('button', {
          name: "Restaurer l'article",
        }) !== null
      )
    },
    // The badge a sold or returned line shows in place of its buttons.
    articleBadge(index: number): 'Vendu' | 'Rendu' | null {
      const row = within(page.articleRow(index))
      if (row.queryByText('Vendu')) return 'Vendu'
      if (row.queryByText('Rendu')) return 'Rendu'
      return null
    },
    articleCount(): number {
      return Number(
        screen.getByText(/Nombre d'articles/).textContent.replace(/\D/g, ''),
      )
    },
    contributionAmount(): number {
      return Number(
        screen
          .getByText(/Montant droit de dépôt/)
          .textContent.replace(/[^\d.]/g, ''),
      )
    },

    // ---- save ------------------------------------------------------------
    // The summary was printed when the deposit was registered: the form
    // saves without asking for it again.
    async save() {
      await u.click(
        screen.getByRole('button', { name: 'Valider et enregistrer le dépôt' }),
      )
    },
    async savedToast(depositIndex: number) {
      return screen.findByText(`Dépôt ${depositIndex} enregistré`)
    },
  }
  return page
}
