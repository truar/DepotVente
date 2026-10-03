// Page object for « Impression des chèques » (/settings/check-print): the
// administrator moves the fields of the cheque to fit the bank's form, prints
// a test sheet, and validates the offsets for this computer.
//
// Also reads back the layout of a printed cheque: where each piece of text
// sits on the A4 sheet, and which areas are painted (the grey of the cheque,
// the coloured guides behind the fields).
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect } from 'vitest'
import { configure, getConfig } from '@testing-library/react'
import { printedBlobs } from '@/test/setup.ts'
import { printedDocuments } from '@/test/printed.ts'
import { openScreen, screen, waitFor } from '@/test/screen.tsx'

export async function checkPrintPage() {
  const { user: u, router } = await openScreen('/settings/check-print')
  await screen.findByRole('heading', { name: 'Impression des chèques' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // An offset by its label as shown, e.g. « Translation horizontale (mm) ».
    offset: (label: string) =>
      Number(screen.getByLabelText<HTMLInputElement>(label).value),
    async setOffset(label: string, value: number) {
      const field = screen.getByLabelText(label)
      await u.clear(field)
      await u.type(field, String(value))
    },
    // Current behaviour, pinned until it is decided: once validated, the
    // screen re-renders without end (see check-print.screen.test.tsx).
    // Under the testing library's act() that endless loop never yields and
    // the click never returns; a browser has no act() and goes on. The click
    // is therefore dispatched the browser's way, outside act().
    async validate() {
      const { eventWrapper } = getConfig()
      configure({ eventWrapper: (dispatch) => dispatch() })
      try {
        await u.click(screen.getByRole('button', { name: 'Valider' }))
      } finally {
        configure({ eventWrapper })
      }
    },
    async printTest() {
      const before = printedDocuments()
      await u.click(screen.getByRole('button', { name: 'Imprimer un test' }))
      await waitFor(() => expect(printedDocuments()).toBe(before + 1), {
        timeout: 15_000,
      })
    },
  }
  return page
}

// ---------------------------------------------------------------------------
// The layout of the last printed document
// ---------------------------------------------------------------------------

export type PrintedText = {
  text: string
  // Position of the text's origin on the sheet, in millimetres from the
  // bottom-left corner of the page (the PDF's own frame), rounded to 0.1.
  x: number
  y: number
  // Turned a quarter-turn (the cheque is fed long side vertical).
  rotated: boolean
}

export type PrintedLayout = {
  texts: Array<PrintedText>
  // The colour of every area painted on the sheet, in order (« #e5e5e5 »
  // for the cheque's grey background, the guide colour behind each field).
  paintedAreas: Array<string>
}

const MM_PER_PT = 25.4 / 72
const toMm = (pt: number) => Math.round(pt * MM_PER_PT * 10) / 10

const FILL_OPS = new Set<number>([
  pdfjs.OPS.fill,
  pdfjs.OPS.eoFill,
  pdfjs.OPS.fillStroke,
  pdfjs.OPS.eoFillStroke,
  pdfjs.OPS.closeFillStroke,
  pdfjs.OPS.closeEOFillStroke,
])

export async function lastPrintedLayout(): Promise<PrintedLayout> {
  const blob = printedBlobs.at(-1)
  if (!blob) throw new Error('Nothing has been printed')
  const data = new Uint8Array(await readBlob(blob))
  const task = pdfjs.getDocument({
    data,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  })
  const doc = await task.promise
  const texts: Array<PrintedText> = []
  const paintedAreas: Array<string> = []
  for (let n = 1; n <= doc.numPages; n++) {
    const pdfPage = await doc.getPage(n)
    const content = await pdfPage.getTextContent()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const [a, b, , , e, f] = item.transform as Array<number>
      texts.push({
        text: item.str,
        x: toMm(e),
        y: toMm(f),
        rotated: Math.abs(b) > Math.abs(a),
      })
    }
    // Follow the fill colour and opacity through the graphics state (saved
    // and restored around every element); an area painted fully transparent
    // leaves nothing on the paper and is not counted.
    const operators = await pdfPage.getOperatorList()
    let fill = { colour: '#000000', opacity: 1 }
    const saved: Array<typeof fill> = []
    operators.fnArray.forEach((fn, index) => {
      const args = operators.argsArray[index] as Array<unknown>
      if (fn === pdfjs.OPS.save) saved.push({ ...fill })
      if (fn === pdfjs.OPS.restore) fill = saved.pop() ?? fill
      if (fn === pdfjs.OPS.setFillRGBColor) {
        fill = { ...fill, colour: String(args[0]) }
      }
      if (fn === pdfjs.OPS.setGState) {
        for (const [key, value] of args[0] as Array<[string, unknown]>) {
          if (key === 'ca') fill = { ...fill, opacity: Number(value) }
        }
      }
      if (
        fn === pdfjs.OPS.constructPath &&
        FILL_OPS.has(args[0] as number) &&
        fill.opacity > 0
      ) {
        paintedAreas.push(fill.colour)
      }
    })
  }
  await task.destroy()
  return { texts, paintedAreas }
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
