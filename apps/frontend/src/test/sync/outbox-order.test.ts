import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db.ts'
import { compareOutboxOrder, syncService } from '@/services/sync-service.ts'

// The deposit flow writes a contact, its deposit and the articles in one
// Dexie transaction. They must reach the server in that order, or the
// foreign keys refuse the children.
describe('outbox ordering', () => {
  beforeEach(() => {
    // Freeze the clock so every operation shares one timestamp, the
    // situation a transaction produces.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-07T20:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('keeps operations written in the same millisecond in insertion order', async () => {
    const contactId = await syncService.addToOutbox(
      'contacts',
      'create',
      'c1',
      {},
    )
    const depositId = await syncService.addToOutbox(
      'deposits',
      'create',
      'd1',
      {},
    )
    const articleIds = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        syncService.addToOutbox('articles', 'create', `a${i}`, {}),
      ),
    )

    const rows = await db.outbox.toArray()
    expect(new Set(rows.map((row) => row.timestamp)).size).toBe(1)

    const ordered = rows.sort(compareOutboxOrder).map((row) => row.id)
    expect(ordered).toEqual([contactId, depositId, ...articleIds])
  })

  it('orders by timestamp first, then insertion order', async () => {
    const later = await syncService.addToOutbox('articles', 'update', 'a1', {})
    vi.setSystemTime(new Date('2026-09-07T19:59:59Z'))
    const earlier = await syncService.addToOutbox(
      'contacts',
      'create',
      'c1',
      {},
    )

    const ordered = (await db.outbox.toArray())
      .sort(compareOutboxOrder)
      .map((row) => row.id)
    expect(ordered).toEqual([earlier, later])
  })

  it('treats rows written by older builds (no seq) as first among equals', () => {
    const legacy = { timestamp: 1, seq: undefined } as never
    const current = { timestamp: 1, seq: 3 } as never
    expect([current, legacy].sort(compareOutboxOrder)).toEqual([
      legacy,
      current,
    ])
  })
})
