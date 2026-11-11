// Page object for « Espèces des caisses » (/reports/cash, admin only): the
// notes and coins of every till count added together. Like the balance, the
// screen shows an « Audit des calculs » panel beside the PDF; the page reads
// the report from it.
import { expect } from 'vitest'
import { plain } from '@/test/amounts.ts'
import { previewedText } from '@/test/printed.ts'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function cashTotalsPage() {
  const { user, router } = await openScreen('/reports/cash')
  await screen.findByRole('heading', { name: 'Audit des calculs' })

  const page = {
    user,
    pathname: () => router.state.location.pathname,
    // Every line of the audit, « 50 € » -> « 3 × 50 € = 150,00 € ».
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
    pdfText: async () => plain(await previewedText()),
    async loaded() {
      await waitFor(() => expect(page.line('Total compté')).toBeDefined())
    },
  }
  return page
}
