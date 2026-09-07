import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { prisma, truncateAll } from './support/database'
import { contact, createTestApp, type TestApp } from './support/test-app'

describe('pull endpoints', () => {
  let t: TestApp

  beforeAll(async () => {
    t = await createTestApp()
  })
  afterAll(() => t.app.close())
  beforeEach(() => truncateAll())

  describe('GET /api/sync/ping', () => {
    it('tells any client the current dataset epoch', async () => {
      const res = await t.app.inject({ method: 'GET', url: '/api/sync/ping' })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({ status: 'ok', datasetEpoch: t.epoch })
    })
  })

  describe('GET /api/sync/initial', () => {
    it('requires authentication', async () => {
      const res = await t.app.inject({ method: 'GET', url: '/api/sync/initial' })

      expect(res.statusCode).toBe(401)
    })

    it('returns every collection and the epoch, whatever epoch the client holds', async () => {
      await prisma.contact.create({ data: contact() })

      const res = await t.app.inject({
        method: 'GET',
        url: '/api/sync/initial',
        headers: t.headers({ 'x-dataset-epoch': 'stale-epoch' }),
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.datasetEpoch).toBe(t.epoch)
      expect(body.contacts).toHaveLength(1)
      expect(body).toMatchObject({
        deposits: [],
        articles: [],
        sales: [],
        refunds: [],
        predeposits: [],
        predepositArticles: [],
        cashRegisterControls: [],
      })
      expect(typeof body.syncedAt).toBe('number')
    })
  })

  describe('GET /api/sync/delta', () => {
    const delta = (since: string | undefined, headers = t.headers()) =>
      t.app.inject({
        method: 'GET',
        url: since === undefined ? '/api/sync/delta' : `/api/sync/delta?since=${since}`,
        headers,
      })

    it('refuses a client synced against another lifetime of the database', async () => {
      const res = await delta('0', t.headers({ 'x-dataset-epoch': randomUUID() }))

      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({
        code: 'EPOCH_MISMATCH',
        serverEpoch: t.epoch,
      })
    })

    it.each([
      ['missing', undefined],
      ['not a number', 'yesterday'],
    ])('rejects a `since` that is %s', async (_label, since) => {
      const res = await delta(since)

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'INVALID_SINCE' })
    })

    it('returns only the records changed since the cursor, with the epoch', async () => {
      const hourAgo = new Date(Date.now() - 3_600_000)
      const old = await prisma.contact.create({
        data: contact({ lastName: 'Ancien', updatedAt: hourAgo }),
      })
      const recent = await prisma.contact.create({
        data: contact({ lastName: 'Récent' }),
      })

      const res = await delta(String(Date.now() - 60_000))

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.datasetEpoch).toBe(t.epoch)
      expect(body.contacts.map((c: { id: string }) => c.id)).toEqual([recent.id])
      expect(body.contacts.map((c: { id: string }) => c.id)).not.toContain(old.id)
    })
  })
})
