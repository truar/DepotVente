// Must come first: see dev-window-shim.ts.
import '@/workers/dev-window-shim.ts'
import { renderDocument } from '@/pdf/render-document.ts'

// Renders the documents the page prints (see pdfRenderer in print.tsx), so
// a long batch print — a day's invoices, the evening's return sheets — does
// not freeze the page. Requests are answered in any order, by id.
self.onmessage = async (event: MessageEvent) => {
  const { id, name, props } = event.data as {
    id: number
    name: string
    props: unknown
  }
  try {
    const blob = await renderDocument(name, props)
    self.postMessage({ id, blob })
  } catch (error) {
    self.postMessage({ id, error: String(error) })
  }
}
