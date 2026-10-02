// Page object for the "Gérer les ventes" screen (/sales/listing): every sale
// of the local base, and a summary line under the table.
import { openScreen, screen, within } from '@/test/screen.tsx'

export async function salesListingPage() {
  const { user: u, router } = await openScreen('/sales/listing')
  await screen.findByRole('heading', { name: 'Gérer les ventes' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // The sale numbers listed, in the table's order.
    saleIndexes(): Array<string> {
      return screen
        .queryAllByRole('row')
        .map((row) => within(row).queryAllByRole('cell'))
        .filter((cells) => cells.length > 1)
        .map((cells) => cells[0].textContent.trim())
    },
    // "Nombre de ventes: 3" under the table.
    salesCount(): number {
      return Number(
        screen.getByText(/^Nombre de ventes/).textContent.replace(/\D/g, ''),
      )
    },
  }
  return page
}
