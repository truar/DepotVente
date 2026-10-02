// Page object for "Modifier un article" (/deposits/articles): the desk
// where a volunteer looks an article up by its code and corrects it — a
// wrong price on the label, a missing serial number, a description.
import { openScreen, screen } from '@/test/screen.tsx'

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
    price: () => screen.getByLabelText<HTMLInputElement>('Prix').value,

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
