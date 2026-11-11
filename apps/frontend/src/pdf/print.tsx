import {  pdf } from '@react-pdf/renderer'
import type {DocumentProps} from '@react-pdf/renderer';
import type { ReactElement } from 'react'
import { documentName } from '@/pdf/documents.ts'
import PdfWorker from '@/workers/pdf.worker?worker'

type Pending = { resolve: (blob: Blob) => void; reject: (error: Error) => void }

// Renders a document to a PDF blob. react-pdf lays out and writes the whole
// file in one go, holding the page meanwhile: a day's invoices or the
// evening's return sheets froze it for seconds (the spinner stopped). The
// work goes to a Web Worker (src/workers/pdf.worker.ts), started at the
// first print and kept for the next ones.
//
// The page renders the document itself, as before, whenever the worker
// cannot: no Worker in this browser (nor in jsdom), a document the worker
// does not know (see documents.ts), props that cannot be sent to it, or a
// worker that failed. Printing never depends on the worker.
class PdfRenderer {
  private worker: Worker | null = null
  // The worker could not start in this page: do not try again each print.
  private unavailable = false
  private nextId = 0
  private pending = new Map<number, Pending>()

  async render(element: ReactElement<DocumentProps>): Promise<Blob> {
    const name = documentName(element)
    if (name && !this.unavailable && typeof Worker !== 'undefined') {
      try {
        return await this.inWorker(name, element.props)
      } catch (error) {
        console.warn(`PDF worker: ${name} rendered in the page instead`, error)
      }
    }
    return pdf(element).toBlob()
  }

  private async inWorker(name: string, props: unknown): Promise<Blob> {
    const worker = this.start()
    const id = ++this.nextId
    const answer = new Promise<Blob>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
    try {
      // Throws DataCloneError if a prop cannot be copied to the worker.
      worker.postMessage({ id, name, props })
    } catch (error) {
      this.pending.delete(id)
      throw error
    }
    return answer
  }

  private start(): Worker {
    if (this.worker) return this.worker
    let worker: Worker
    try {
      worker = new PdfWorker()
    } catch (error) {
      this.unavailable = true
      throw error
    }
    worker.onmessage = (event: MessageEvent) => {
      const { id, blob, error } = event.data as {
        id: number
        blob?: Blob
        error?: string
      }
      const pending = this.pending.get(id)
      if (!pending) return
      this.pending.delete(id)
      if (blob) pending.resolve(blob)
      else pending.reject(new Error(error ?? 'No PDF from the worker'))
    }
    // The worker script failed to load or crashed: what it was rendering
    // is rendered in the page, and so is every later print.
    worker.onerror = (event: ErrorEvent) => {
      this.unavailable = true
      this.worker = null
      worker.terminate()
      const error = new Error(event.message || 'PDF worker failed')
      for (const pending of this.pending.values()) pending.reject(error)
      this.pending.clear()
    }
    this.worker = worker
    return worker
  }
}

export const pdfRenderer = new PdfRenderer()

export function renderPdf(Pdf: ReactElement<DocumentProps>): Promise<Blob> {
  return pdfRenderer.render(Pdf)
}

export async function printPdf(Pdf: ReactElement<DocumentProps>) {
  const blob = await renderPdf(Pdf)
  const blobURL = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe') // load content in an iframe to print later
  document.body.appendChild(iframe)

  iframe.style.display = 'none'
  iframe.src = blobURL
  iframe.onload = function () {
    setTimeout(function () {
      iframe.focus()
      if (iframe.contentWindow) {
        iframe.contentWindow.print()
      }
    }, 1)
  }
}
