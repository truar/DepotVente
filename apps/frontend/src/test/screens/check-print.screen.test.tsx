import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import type * as ReactPdf from '@react-pdf/renderer'
import type { PrintedLayout } from '@/test/pages/check-print.page.ts'
import { givenDeposit, givenWorkstation } from '@/test/harness.ts'
import {
  checkPrintPage,
  lastPrintedLayout,
} from '@/test/pages/check-print.page.ts'
import { returnsIndividualsPage } from '@/test/pages/returns-individuals.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// The on-screen preview of « Impression des chèques » is react-pdf's
// PDFViewer, which only exists in a browser build: under Node it throws and
// takes the whole screen down. It is replaced by nothing here. What this file
// checks is the printed sheet, which goes through the real renderer.
vi.mock('@react-pdf/renderer', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactPdf>()),
  PDFViewer: () => null,
}))

// Where each field of Camille Durand's cheque lands on the A4 sheet with the
// offsets the app ships with, in millimetres from the bottom-left corner of
// the page. The cheque is fed long side vertical: every line is turned a
// quarter-turn, and moving a field « down » the cheque lowers its y.
const defaultLayout = [
  { text: 'cent soixante-dix-huit euros', x: 123.2, y: 269.4 },
  { text: 'Camille Durand', x: 111.8, y: 293.4 },
  { text: '178', x: 113.6, y: 165.4 },
  { text: 'Rumilly', x: 105, y: 167.4 },
]

// The date is left out: it is today's, in the computer's own format.
function positions(layout: PrintedLayout) {
  return layout.texts
    .filter(({ text }) => text !== new Date().toLocaleDateString())
    .map(({ text, x, y }) => ({ text, x, y }))
}

function moved(dy: number) {
  return defaultLayout.map((field) => ({
    ...field,
    y: Math.round((field.y + dy) * 10) / 10,
  }))
}

// CHQ-12. The administrator fits the cheque to the bank's form in
// « Impression des chèques » (on a test sheet with coloured guides and the
// cheque's grey outline), validates, and from then on the real cheques
// printed at the private sellers' return desk follow those offsets, on a
// plain sheet: no guides, no grey.
describe('Screen: the cheque printed with the offsets of « Impression des chèques »', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 12,
      soldAmount: 200,
      sellerAmount: 178,
      seller: { lastName: 'Durand', firstName: 'Camille' },
    })
  })

  async function printDurandCheque(): Promise<PrintedLayout> {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')
    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })
    await page.printCheque()
    return lastPrintedLayout()
  }

  it('prints the fields where the shipped offsets put them, turned a quarter-turn', async () => {
    const cheque = await printDurandCheque()

    expect(positions(cheque)).toEqual(defaultLayout)
    expect(cheque.texts.every(({ rotated }) => rotated)).toBe(true)
  })

  // 10 mm more of « Marge gauche » moves the whole content 10 mm down the
  // cheque (the right column sits beside the left one, it follows).
  it('prints the real cheque with the margin validated there', async () => {
    const settings = await checkPrintPage()
    expect(settings.offset('Marge gauche (mm)')).toBe(-7)
    await settings.setOffset('Marge gauche (mm)', 3)
    await settings.validate()

    const cheque = await printDurandCheque()

    expect(positions(cheque)).toEqual(moved(-10))
  })

  // An offset typed but not validated is not used.
  it('ignores an offset typed but not validated', async () => {
    const settings = await checkPrintPage()
    await settings.setOffset('Marge gauche (mm)', 3)

    const cheque = await printDurandCheque()

    expect(positions(cheque)).toEqual(defaultLayout)
  })

  // The screen labels the global translation in millimetres.
  it('moves the cheque by the translation validated there, counted in points', async () => {
    const settings = await checkPrintPage()
    expect(settings.offset('Translation horizontale (mm)')).toBe(280.6)
    await settings.setOffset('Translation horizontale (mm)', 290.6)
    await settings.validate()

    const cheque = await printDurandCheque()

    // Current behaviour, pinned until it is decided: « Translation
    // horizontale (mm) » and « Translation verticale (mm) » are applied in
    // PDF points, not millimetres: 10 more moves the cheque 3.5 mm
    // (10 pt), where the margins move it 10 mm.
    expect(positions(cheque)).toEqual(moved(-3.5))
  })

  // The test sheet carries the grey outline of the cheque and a guide
  // behind each of the five fields; the real cheque, printed from the same
  // offsets, carries neither.
  it('leaves the guides and the grey background off the real cheque', async () => {
    const settings = await checkPrintPage()
    await settings.printTest()
    const testSheet = await lastPrintedLayout()
    expect(testSheet.paintedAreas).toEqual([
      '#e5e5e5',
      '#cccccc',
      '#cccccc',
      '#cccccc',
      '#cccccc',
      '#cccccc',
    ])

    const cheque = await printDurandCheque()

    expect(cheque.paintedAreas).toEqual([])
  })
})

// Code review while pinning CHQ-12: what the screen does once offsets have
// been validated on this computer.
describe('Screen: « Impression des chèques » once offsets are validated', () => {
  let consoleError: MockInstance<typeof console.error>

  beforeEach(() => {
    signedInAs('ADMIN')
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  const endlessRenders = () =>
    consoleError.mock.calls.filter(([message]) =>
      String(message).includes('Maximum update depth exceeded'),
    ).length

  it('shows the validated value when the screen is opened again', async () => {
    const first = await checkPrintPage()
    await first.setOffset('Marge gauche (mm)', 3)
    await first.validate()

    const again = await checkPrintPage()

    expect(again.offset('Marge gauche (mm)')).toBe(3)
  })

  it('re-renders without end once offsets are validated', async () => {
    const first = await checkPrintPage()
    await first.setOffset('Marge gauche (mm)', 3)
    expect(endlessRenders()).toBe(0)

    await first.validate()

    // Current behaviour, pinned until it is decided: the hook hands the
    // screen a new offsets object on every render, and the screen copies it
    // into its own state whenever the form is not being edited; that
    // re-renders, which hands a new object... React reports the loop. It
    // starts after « Valider », and again each time the screen is opened
    // with offsets stored on the computer.
    await waitFor(() => expect(endlessRenders()).toBeGreaterThan(0))
    consoleError.mockClear()
    await checkPrintPage()
    await waitFor(() => expect(endlessRenders()).toBeGreaterThan(0))
  })
})
