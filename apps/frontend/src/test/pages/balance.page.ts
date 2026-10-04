// Page object for the « Bilan de la bourse » (/reports/balance, admin only).
// The screen shows, beside the PDF, an « Audit des calculs » panel: every
// line of the report with its value. The page reads the report from it, as
// the treasurer checks it on the evening.
import { expect } from 'vitest'
import { plain } from '@/test/amounts.ts'
import { previewedText } from '@/test/printed.ts'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function balancePage() {
  const { user, router } = await openScreen('/reports/balance')
  await screen.findByRole('heading', { name: 'Audit des calculs' })

  const page = {
    user,
    pathname: () => router.state.location.pathname,
    // Every line of the report, « Montant du dépôt » -> « 860,00 € », as
    // written on the screen (spaces made plain).
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
    line: (label: string) => page.lines()[label],
    // The text of the PDF shown beside the audit.
    pdfText: async () => plain(await previewedText()),
    // The report is read from the local base asynchronously.
    async loaded() {
      await waitFor(() => expect(page.line('Nombre de fiches')).toBeDefined())
    },
  }
  return page
}
