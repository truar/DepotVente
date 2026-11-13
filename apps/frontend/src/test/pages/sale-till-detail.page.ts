// Page object for « Détail caisse de vente » (/reports/sale-tills, admin
// only): one sale till at a time, every sale under its payment method, as
// its count used to print it. The audit panel beside the PDF gives the
// totals of the payment methods.
import { expect } from 'vitest'
import { plain } from '@/test/amounts.ts'
import { previewedTexts } from '@/test/printed.ts'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function saleTillDetailPage() {
  const { user, router } = await openScreen('/reports/sale-tills')
  await screen.findByRole('heading', { name: 'Audit des calculs' })

  const page = {
    user,
    pathname: () => router.state.location.pathname,
    tills: () =>
      within(screen.getByRole('combobox', { name: 'Caisse' }))
        .getAllByRole('option')
        .map((option) => option.textContent),
    async chooseTill(till: number) {
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Caisse' }),
        String(till),
      )
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: `Caisse ${till}` }),
        ).toBeDefined(),
      )
    },
    // Every line of the audit, « Cartes » -> « 150,00 € ».
    lines(): Record<string, string> {
      const panel = screen
        .getByRole('heading', { name: 'Audit des calculs' })
        .closest('aside')
      if (!panel) throw new Error('No audit panel')
      const lines: Record<string, string> = {}
      for (const row of within(panel).getAllByRole('row')) {
        const [label, value] = within(row).getAllByRole('cell')
        const name = label.querySelector('div')?.textContent ?? ''
        lines[plain(name)] = plain(value.textContent)
      }
      return lines
    },
    // The PDF shown for this till: the viewer renders again when the till
    // changes, and the renders end in no set order.
    async pdfText(till: number) {
      const heading = `Contrôle caisse ventes N° ${till}`
      let text: string | undefined
      await waitFor(
        async () => {
          text = (await previewedTexts())
            .map(plain)
            .find((pdf) => pdf.includes(heading))
          expect(text).toBeDefined()
        },
        { timeout: 15_000 },
      )
      return text!
    },
  }
  return page
}
