// Runs before every test file (see `test.setupFiles` in vite.config.ts).
//
// The application keeps its state in IndexedDB through Dexie; fake-indexeddb
// provides one in memory so the real hooks, services and schema run
// unchanged. Every test starts from an empty base.
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import { db } from '@/db.ts'

beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear()
  })
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

// The summary PDF is handed to the browser's print dialog through a blob
// iframe; jsdom has no object URLs and nothing to print to.
URL.createObjectURL = () => 'blob:jsdom'
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
