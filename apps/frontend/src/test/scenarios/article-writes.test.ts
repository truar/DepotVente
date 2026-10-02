import { afterEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { givenDeposit, local, runHook } from '@/test/harness.ts'

// The local base is the source of truth: an article write that fails here
// must stop the operation, never reach the other computers through the
// outbox while this one kept the old value.
describe('An article write that fails on this computer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const failure = new Error('IndexedDB write failed')

  it('stops a correction before it is queued for the server', async () => {
    const { articles } = await givenDeposit()
    vi.spyOn(db.articles, 'bulkUpdate').mockRejectedValue(failure)
    const { update } = await runHook(useArticlesDb)

    await expect(update(articles[0].id, { price: 95 })).rejects.toThrow(failure)

    expect(await local.outbox()).toEqual([])
  })

  it('stops a return before it is queued for the server', async () => {
    const { articles } = await givenDeposit()
    vi.spyOn(db.articles, 'update').mockRejectedValue(failure)
    const { markArticleAsReturned } = await runHook(useArticlesDb)

    await expect(markArticleAsReturned(articles[0].id)).rejects.toThrow(failure)

    expect(await local.outbox()).toEqual([])
  })

  it('stops new articles before they are queued for the server', async () => {
    const { articles } = await givenDeposit()
    await db.articles.clear()
    vi.spyOn(db.articles, 'bulkPut').mockRejectedValue(failure)
    const { batchUpsert } = await runHook(useArticlesDb)

    await expect(batchUpsert(articles)).rejects.toThrow(failure)

    expect(await local.outbox()).toEqual([])
  })
})
