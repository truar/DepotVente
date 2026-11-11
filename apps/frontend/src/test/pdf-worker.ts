// In the browser a printed document is rendered in a Web Worker (src/workers/
// pdf.worker.ts), so a long batch print does not freeze the page. jsdom has
// no Worker: printing then renders in the page, as the rest of the suite
// does. A story about the worker itself stands this one in: it answers the
// page as the worker does, in-process, and keeps what it was asked.
import { afterEach, vi } from 'vitest'
import { pdfRenderer } from '@/pdf/print.tsx'
import { renderDocument } from '@/pdf/render-document.ts'

type PdfRequest = { id: number; name: string; props: unknown }

class InProcessPdfWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null
  readonly requests: Array<PdfRequest> = []

  postMessage(request: PdfRequest) {
    // What crosses to a real worker is a structured clone, not the object.
    const cloned = structuredClone(request)
    this.requests.push(cloned)
    void this.handle(cloned)
  }

  private async handle({ id, name, props }: PdfRequest) {
    try {
      const blob = await renderDocument(name, props)
      this.onmessage?.({ data: { id, blob } })
    } catch (error) {
      this.onmessage?.({ data: { id, error: String(error) } })
    }
  }

  terminate() {}
}

export function givenPdfWorker() {
  let worker: InProcessPdfWorker | null = null
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        worker = new InProcessPdfWorker()
        return worker
      }
    },
  )
  // The page keeps the worker it started; this story starts its own.
  Reflect.set(pdfRenderer, 'worker', null)
  return {
    // The documents the worker was asked to render, by name.
    rendered: () => worker?.requests.map((request) => request.name) ?? [],
  }
}

// A browser where the worker script does not start (blocked, missing from
// an old build): constructing it throws.
export function givenABrokenPdfWorker() {
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw new Error('The PDF worker cannot start')
      }
    },
  )
  Reflect.set(pdfRenderer, 'worker', null)
}

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.set(pdfRenderer, 'worker', null)
  Reflect.set(pdfRenderer, 'unavailable', false)
})
