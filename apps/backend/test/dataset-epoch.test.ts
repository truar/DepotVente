import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { prisma, truncateAll } from './support/database'
import { createTestApp, pushBody, type TestApp } from './support/test-app'

// The scenario that motivated the epoch: the admin wipes the server database
// during a test session while the client computers keep their IndexedDB.
describe('dataset epoch across database lifetimes', () => {
  const apps: TestApp[] = []
  const boot = async () => {
    const t = await createTestApp()
    apps.push(t)
    return t
  }

  beforeAll(() => truncateAll({ keepEpoch: false }))
  afterEach(async () => {
    await Promise.all(apps.splice(0).map((t) => t.app.close()))
  })

  it('is created on first boot and survives restarts', async () => {
    const first = await boot()
    const second = await boot()

    expect(first.epoch).toMatch(/^[0-9a-f-]{36}$/)
    expect(second.epoch).toBe(first.epoch)
    await expect(prisma.datasetEpoch.count()).resolves.toBe(1)
  })

  it('changes when the database is reset, and clients holding the old one are refused', async () => {
    const before = await boot()
    const oldEpoch = before.epoch
    await before.app.close()

    await truncateAll({ keepEpoch: false })
    const after = await boot()

    expect(after.epoch).not.toBe(oldEpoch)

    const staleHeaders = after.headers({ 'x-dataset-epoch': oldEpoch })
    const push = await after.app.inject({
      method: 'POST',
      url: '/api/push',
      headers: staleHeaders,
      payload: pushBody(),
    })
    const delta = await after.app.inject({
      method: 'GET',
      url: '/api/sync/delta?since=0',
      headers: staleHeaders,
    })

    expect(push.statusCode).toBe(409)
    expect(delta.statusCode).toBe(409)
    expect(push.json()).toMatchObject({
      code: 'EPOCH_MISMATCH',
      serverEpoch: after.epoch,
    })

    // Once the client has re-synced (adopting the new epoch) it is served.
    const fresh = await after.app.inject({
      method: 'POST',
      url: '/api/push',
      headers: after.headers(),
      payload: pushBody(),
    })
    expect(fresh.statusCode).toBe(200)
  })
})
