// Page object for the "Enregistrer des articles" screen (/deposits/add).
//
// Everything a story needs to know about this screen's markup lives here:
// which button is which, how the status select is found, what "printed"
// means. Actions do things; readers return what the volunteer sees, and the
// story does the expecting.
import { expect } from 'vitest'
import type { User } from '@/test/screen.tsx'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

const PREDEPOSIT_PLACEHOLDER = /Rechercher une fiche/

export async function depositAddPage(user?: User) {
  const opened = user
    ? { user, router: undefined }
    : await openScreen('/deposits/add')
  await screen.findByRole('heading', { name: 'Enregistrer des articles' })
  const u = opened.user

  const page = {
    user: u,
    // Where the router is, e.g. after leaving the screen.
    pathname: () => opened.router?.state.location.pathname ?? null,

    // ---- predeposit combobox ------------------------------------------
    async pickPredeposit(name: string) {
      await u.click(page.predepositCombobox())
      await u.click(await screen.findByRole('option', { name }))
    },
    async validatePredeposit() {
      await page.clickValidatePredeposit()
      // The form is filled asynchronously from the local base.
      await waitFor(() => expect(page.seller().lastName).not.toBe(''))
    },
    // Validating without waiting for the form: used when the screen asks
    // before replacing a fiche already loaded.
    async clickValidatePredeposit() {
      await u.click(screen.getByRole('button', { name: 'Valider' }))
    },
    // The fiche the combobox shows, or null when it shows its placeholder.
    selectedPredeposit(): string | null {
      const text = page.predepositCombobox().textContent
      return PREDEPOSIT_PLACEHOLDER.test(text) ? null : text.trim()
    },
    async offeredPredeposits(): Promise<Array<string>> {
      await u.click(page.predepositCombobox())
      await screen.findByRole('listbox')
      const names = screen
        .queryAllByRole('option')
        .map((option) => option.textContent.trim())
      await u.keyboard('{Escape}')
      return names
    },
    predepositCombobox() {
      const comboboxes = screen.getAllByRole('combobox')
      const button = comboboxes.find(
        (el) => el.tagName === 'BUTTON' && !el.textContent.includes('Statut'),
      )
      if (!button) throw new Error('No predeposit combobox on the screen')
      return button
    },

    // ---- seller block ----------------------------------------------------
    seller() {
      const value = (label: string) =>
        screen.getByLabelText<HTMLInputElement>(label).value
      // The city is a datalist field whose label is not bound to its input;
      // read it with hasDisplayValue().
      return {
        lastName: value('Nom'),
        firstName: value('Prénom'),
        phoneNumber: value('Téléphone'),
      }
    },
    hasDisplayValue(value: string) {
      return screen.queryByDisplayValue(value) !== null
    },

    // ---- articles --------------------------------------------------------
    // Short codes shown on the article rows, e.g. "1001 A".
    articleCodes(): Array<string> {
      return screen
        .queryAllByDisplayValue<HTMLInputElement>(/^\d+ [A-Z]+$/)
        .map((input) => input.value)
    },
    hasText(text: string) {
      return screen.queryByText(text) !== null
    },

    // ---- seller, typed by hand ---------------------------------------
    async fillSeller(seller: {
      lastName: string
      firstName: string
      phoneNumber: string
      city?: string
    }) {
      // An empty value leaves the field as it is.
      const type = async (label: string, value: string) => {
        if (value) await u.type(screen.getByLabelText(label), value)
      }
      await type('Nom', seller.lastName)
      await type('Prénom', seller.firstName)
      await type('Téléphone', seller.phoneNumber)
      if (seller.city) {
        // Datalist field: its label is not bound to the input.
        const city = document.querySelector<HTMLInputElement>(
          'input[name="deposit.city"]',
        )
        if (!city) throw new Error('No city input on the screen')
        await u.type(city, seller.city)
      }
    },

    // ---- article rows ------------------------------------------------
    async addArticle() {
      await u.click(
        screen.getByRole('button', { name: 'Ajouter un nouvel article' }),
      )
    },
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
    async removeArticle(index: number) {
      const row = page.articleRow(index)
      await u.click(
        within(row).getByRole('button', { name: "Supprimer l'article" }),
      )
    },
    async restoreArticle(index: number) {
      const row = page.articleRow(index)
      await u.click(
        within(row).getByRole('button', { name: "Restaurer l'article" }),
      )
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
    // The red lines above the form, if any.
    errors(): Array<string> {
      return screen
        .queryAllByText(/^Merci/)
        .map((line) => line.textContent.trim())
    },

    // ---- leaving or resetting the screen ------------------------------
    async cancel() {
      await u.click(screen.getByRole('button', { name: 'Annuler' }))
    },
    async backToMenu() {
      await u.click(screen.getByRole('link', { name: 'Retour au menu' }))
    },
    // The confirmation dialog currently open, with its two answers.
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
    isDialogOpen() {
      return screen.queryByRole('alertdialog') !== null
    },
    isArticleDeleted(index: number) {
      return (
        within(page.articleRow(index)).queryByRole('button', {
          name: "Restaurer l'article",
        }) !== null
      )
    },

    // ---- contribution, print, save -------------------------------------
    async chooseStatus(label: string) {
      await u.click(screen.getByText('Statut').closest('button')!)
      await u.click(await screen.findByRole('option', { name: label }))
    },
    // The summary is handed to the browser's print dialog through an iframe;
    // the form only saves once that has happened.
    async printSummary() {
      const before = document.querySelectorAll('iframe').length
      await u.click(screen.getByRole('button', { name: 'Imprimer' }))
      await waitFor(
        () =>
          expect(document.querySelectorAll('iframe').length).toBe(before + 1),
        { timeout: 15_000 },
      )
    },
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
