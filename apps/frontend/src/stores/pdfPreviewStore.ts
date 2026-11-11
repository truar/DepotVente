import { create } from 'zustand'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

// A document shown in the « Aperçu » window (PdfPreviewHost), before or
// instead of printing it. On older Windows PCs the browser's print dialog
// is the only view printPdf offers, and it is too small to read and cannot
// be zoomed: the window shows the document in the browser's PDF viewer,
// which can.
export type PdfPreview = {
  title: string
  document: ReactElement<DocumentProps>
  // What printing this document means to the screen that asked for it (a
  // count to be validated once printed, a summary marked as printed). Run
  // when « Imprimer » is clicked in the window, as after a direct print.
  onPrint?: () => void
}

interface PdfPreviewState {
  preview: PdfPreview | null
  close: () => void
}

export const usePdfPreviewStore = create<PdfPreviewState>((set) => ({
  preview: null,
  close: () => set({ preview: null }),
}))

export function previewPdf(preview: PdfPreview) {
  usePdfPreviewStore.setState({ preview })
}
