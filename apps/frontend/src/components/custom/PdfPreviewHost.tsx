import { PDFViewer, pdf } from '@react-pdf/renderer'
import { Download, Printer, X } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { printPdf } from '@/pdf/print.tsx'
import { usePdfPreviewStore } from '@/stores/pdfPreviewStore'

// « Bilan caisse 3 » → « Bilan caisse 3.pdf », without the characters a
// Windows file name cannot hold.
const pdfFileName = (title: string) =>
  `${title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document'}.pdf`

/**
 * The « Aperçu » window: nearly the whole screen, the document in the
 * browser's PDF viewer (zoom with its toolbar or Ctrl + wheel), and the
 * three things one does with it next.
 */
export function PdfPreviewHost() {
  const preview = usePdfPreviewStore((s) => s.preview)
  const close = usePdfPreviewStore((s) => s.close)
  const [busy, setBusy] = useState(false)

  const print = async () => {
    if (!preview) return
    setBusy(true)
    try {
      await printPdf(preview.document)
      preview.onPrint?.()
      close()
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (!preview) return
    setBusy(true)
    try {
      const blob = await pdf(preview.document).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = pdfFileName(preview.title)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={preview != null}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-3 p-3 sm:max-w-[95vw]"
      >
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="text-base">{preview?.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Aperçu du document avant impression
          </DialogDescription>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void download()}
            >
              <Download />
              Télécharger
            </Button>
            <Button type="button" disabled={busy} onClick={() => void print()}>
              <Printer />
              Imprimer
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              <X />
              Fermer
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          {preview && (
            <PDFViewer width="100%" height="100%" style={{ border: 0 }}>
              {preview.document}
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
