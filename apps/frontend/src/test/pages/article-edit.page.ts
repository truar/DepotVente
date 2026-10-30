// Page object for "Modifier un article" (/deposits/articles): the desk
// where a volunteer looks an article up by its code and corrects it — a
// wrong price on the label, a missing serial number, a description.
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function articleEditPage() {
  const { user: u, router } = await openScreen('/deposits/articles')
  await screen.findByRole('heading', { name: 'Modifier un article' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- looking the article up ------------------------------------------
    // The volunteer types (or scans) the code and presses Enter; the form
    // opens on the article, labelled by its short code ("12 A").
    async search(code: string, shortCode: string) {
      await u.type(
        screen.getByPlaceholderText('Ex: 2026 1001A'),
        `${code}{Enter}`,
      )
      await screen.findByDisplayValue(shortCode)
    },
    // Searching while an article is open: the form stays on that article
    // until the volunteer answers the question.
    async searchAnother(code: string) {
      await u.type(
        screen.getByPlaceholderText('Ex: 2026 1001A'),
        `${code}{Enter}`,
      )
    },
    // Opens another article while one is open, answering yes to the
    // question.
    async openAnother(code: string, shortCode: string) {
      await page.searchAnother(code)
      await (await page.question()).confirm()
      await screen.findByDisplayValue(shortCode)
    },
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

    async validate() {
      await u.click(screen.getByRole('button', { name: 'Valider' }))
    },

    // ---- what the volunteer is told ------------------------------------
    async lastToast(text: string) {
      return screen.findByText(text)
    },
  }
  return page
}
