// The « Aperçu » window (PdfPreviewHost): a document shown nearly full
// screen in the browser's PDF viewer, before or instead of printing it.
import { expect } from 'vitest'
import { previewedText, printedDocuments } from '@/test/printed.ts'
import type { User } from '@/test/screen.tsx'
import { screen, waitFor, within } from '@/test/screen.tsx'

export async function pdfPreview(u: User) {
  const box = await screen.findByRole('dialog')
  const preview = {
    title: within(box).getByRole('heading').textContent.trim(),
    // What the window shows, once rendered.
    text: () => previewedText(),
    // « Imprimer » sends the document shown to the printer and closes.
    async print() {
      const before = printedDocuments()
      await u.click(within(box).getByRole('button', { name: 'Imprimer' }))
      await waitFor(() => expect(printedDocuments()).toBe(before + 1), {
        timeout: 15_000,
      })
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    },
    async close() {
      await u.click(within(box).getByRole('button', { name: 'Fermer' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    },
  }
  return preview
}
