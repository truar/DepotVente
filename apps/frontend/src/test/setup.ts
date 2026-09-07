// Runs before every test file (see `test.setupFiles` in vite.config.ts).
//
// The application keeps its state in IndexedDB through Dexie; fake-indexeddb
// provides one in memory so the real hooks, services and schema run
// unchanged. Every test starts from an empty base.
import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'
import { db } from '@/db.ts'

beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear()
  })
})
