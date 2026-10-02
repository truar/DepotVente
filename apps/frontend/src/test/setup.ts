// Runs before every test file (see `test.setupFiles` in vite.config.ts).
//
// The application keeps its state in IndexedDB through Dexie; fake-indexeddb
// provides one in memory so the real hooks, services and schema run
// unchanged. Every test starts from an empty base.
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { db } from '@/db.ts'
import { server } from '@/test/server.ts'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear()
  })
})

// Unmount whatever a screen test rendered; without `globals` the testing
// library does not do it on its own. The print iframes live outside the
// React root and would otherwise leak into the next test.
afterEach(() => {
  cleanup()
  document.querySelectorAll('iframe').forEach((iframe) => iframe.remove())
  printedBlobs.length = 0
})

// ---------------------------------------------------------------------------
// Screen tests: what jsdom lacks and the UI primitives (Radix popover and
// select, cmdk) expect to exist, plus the printer boundary.
// ---------------------------------------------------------------------------

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// jsdom defines none of these; the assignments are unconditional on purpose.
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView = () => {}
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}

// Printing hands a PDF blob to the browser's print dialog through an
// iframe; jsdom has no object URLs and nothing to print to. The blobs are
// kept so a story can read back what would have come out of the printer
// (see printed.ts).
export const printedBlobs: Array<Blob> = []
URL.createObjectURL = (blob: Blob | MediaSource) => {
  if (blob instanceof Blob) printedBlobs.push(blob)
  return `blob:jsdom/${printedBlobs.length}`
}
URL.revokeObjectURL = () => {}
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList

// A browser hands a promise rejection nobody caught to the window, as an
// 'unhandledrejection' event the app may handle (and cancel); jsdom does
// not. Forward it the same way. A rejection the app leaves alone still
// reaches Vitest's own listeners and fails the run, as before.
type RejectionListener = (reason: unknown, promise: Promise<unknown>) => void
const bridged = process as typeof process & { rejectionBridge?: true }
if (!bridged.rejectionBridge) {
  bridged.rejectionBridge = true
  const reporters = process.listeners(
    'unhandledRejection',
  ) as Array<RejectionListener>
  process.removeAllListeners('unhandledRejection')
  process.on('unhandledRejection', (reason, promise) => {
    const event = new Event('unhandledrejection', { cancelable: true })
    Object.assign(event, { reason, promise })
    window.dispatchEvent(event)
    if (event.defaultPrevented) return
    for (const report of reporters) report(reason, promise)
  })
}
