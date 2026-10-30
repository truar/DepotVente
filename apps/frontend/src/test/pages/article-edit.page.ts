// Page object for "Modifier un article" (/deposits/articles/:id/edit): the
// desk where a volunteer corrects an article — a wrong price on the label, a
// missing serial number, a description. The article is reached from the
// articles list, by scanning or typing its code there.
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function articleEditPage() {
  const { user: u, router } = await openScreen('/deposits/articles')
  await screen.findByRole('heading', { name: 'Liste des articles' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- looking the article up ------------------------------------------
    // On the list, the volunteer types (or scans) the code and presses
    // Enter; the form opens on the article, labelled by its short code
    // ("12 A").
    async search(code: string, shortCode: string) {
      await u.type(
        screen.getByPlaceholderText('Ex: 2026 1001A'),
        `${code}{Enter}`,
      )
      await screen.findByRole('heading', { name: 'Modifier un article' })
      await screen.findByDisplayValue(shortCode)
    },
    // « Retour à la liste des articles » always asks first.
    async backToList() {
      await u.click(
        screen.getByRole('link', { name: 'Retour à la liste des articles' }),
      )
      return page.question()
    },
    // Opens another article: back to the list, answering yes, then its
    // code.
    async openAnother(code: string, shortCode: string) {
      await (await page.backToList()).confirm()
      await page.isOnList()
      await page.search(code, shortCode)
    },
    // After a save or a cancel the volunteer is back on the list, the
    // cursor in the code field for the next one.
    async isOnList() {
      await screen.findByRole('heading', { name: 'Liste des articles' })
    },
    searchField: () => screen.getByPlaceholderText('Ex: 2026 1001A'),
    async question() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        confirm: () =>
          u.click(within(box).getByRole('button', { name: 'Oui' })),
        decline: () =>
          u.click(within(box).getByRole('button', { name: 'Non' })),
      }
    },
    isQuestionOpen: () => screen.queryByRole('alertdialog') !== null,

    // ---- correcting it -----------------------------------------------------
    async setPrice(price: string) {
      const input = screen.getByLabelText('Prix')
      await u.clear(input)
      await u.type(input, price)
    },
    async setDescription(text: string) {
      const input = screen.getByLabelText('Descriptif/Motif suppression')
      await u.clear(input)
      await u.type(input, text)
    },
    async setSerialNumber(text: string) {
      const input = screen.getByLabelText('N° Série')
      await u.clear(input)
      if (text) await u.type(input, text)
    },
    async setColor(text: string) {
      const input = screen.getByLabelText('Couleur')
      await u.clear(input)
      if (text) await u.type(input, text)
    },
    // In the open list only, which the select names in aria-controls: a
    // whole-page search would also go through the color datalist.
    async setStatus(label: string) {
      const select = screen.getByRole('combobox', { name: 'Statut' })
      await u.click(select)
      const list = await waitFor(() => {
        const open = document.getElementById(
          select.getAttribute('aria-controls') ?? '',
        )
        if (!open) throw new Error('The status list is not open')
        return open
      })
      await u.click(await within(list).findByRole('option', { name: label }))
    },
    // What the form shows for the article opened.
    price: () => screen.getByLabelText<HTMLInputElement>('Prix').value,
    description: () =>
      screen.getByLabelText<HTMLInputElement>('Descriptif/Motif suppression')
        .value,
    serialNumber: () =>
      screen.getByLabelText<HTMLInputElement>('N° Série').value,
    color: () => screen.getByLabelText<HTMLInputElement>('Couleur').value,
    status: () =>
      screen.getByRole('combobox', { name: 'Statut' }).textContent.trim(),

    async printLabel() {
      await u.click(
        screen.getByRole('button', { name: "Imprimer l'étiquette" }),
      )
    },

    async validate() {
      await u.click(screen.getByRole('button', { name: 'Valider' }))
    },
    // Drops what was typed, answering yes to the question.
    async cancel() {
      await u.click(screen.getByRole('button', { name: 'Annuler' }))
      await (await page.question()).confirm()
    },

    // ---- what the volunteer is told ------------------------------------
    async lastToast(text: string) {
      return screen.findByText(text)
    },
  }
  return page
}
