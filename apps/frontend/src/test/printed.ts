// What came out of the printer. The app renders real PDFs (react-pdf) and
// hands them to the print dialog; setup.ts keeps the blobs, and this reads
// their text back so a story can check what is on the paper.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect } from 'vitest'
import { previewedBlobs, printedBlobs } from '@/test/setup.ts'
import { waitFor } from '@/test/screen.tsx'

// No Web Worker in jsdom: pdfjs falls back to importing the worker module
// in-process, and needs to be told where it is.
const require = createRequire(import.meta.url)
const pdfjsFile = (path: string) => pathToFileURL(require.resolve(path)).href
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsFile(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
)

export function printedDocuments(): number {
  return printedBlobs.length
}

// Text of the last printed document, pages joined, whitespace collapsed.
export async function lastPrintedText(): Promise<string> {
  const blob = printedBlobs.at(-1)
  if (!blob) throw new Error('Nothing has been printed')
  return pdfText(blob)
}

// Text of the PDF a report screen shows beside its audit, once rendered.
export async function previewedText(): Promise<string> {
  await waitFor(() => expect(previewedBlobs.length).toBeGreaterThan(0), {
    timeout: 15_000,
  })
  return pdfText(previewedBlobs.at(-1)!)
}

async function pdfText(blob: Blob): Promise<string> {
  const data = new Uint8Array(await readBlob(blob))
  // Text only: no glyphs are drawn, so the font files pdfjs would fetch
  // for rendering are not needed; keep its warnings about them quiet.
  const task = pdfjs.getDocument({
    data,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  })
  const doc = await task.promise
  const pages: Array<string> = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const content = await page.getTextContent()
    pages.push(
      content.items.map((item) => ('str' in item ? item.str : '')).join(' '),
    )
  }
  await task.destroy()
  const text = pages.join('\n').replace(/\s+/g, ' ').trim()
  return text
}

// jsdom's Blob has no arrayBuffer(); FileReader it is.
function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}
