import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { prisma, truncateAll } from './support/database'
import {
  contact,
  createTestApp,
  pushBody,
  type TestApp,
} from './support/test-app'

describe('POST /api/push', () => {
  let t: TestApp

  beforeAll(async () => {
    t = await createTestApp()
  })
  afterAll(() => t.app.close())
  beforeEach(() => truncateAll())

  const push = (body: unknown, headers = t.headers()) =>
    t.app.inject({ method: 'POST', url: '/api/push', headers, payload: body })

  describe('gatekeeping', () => {
    it('refuses an unauthenticated client', async () => {
      const res = await push(pushBody(), t.headers({ authorization: undefined }))

      expect(res.statusCode).toBe(401)
    })

    it('refuses a client that does not state its dataset epoch', async () => {
      const res = await push(
        pushBody(),
        t.headers({ 'x-dataset-epoch': undefined }),
      )

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({
        code: 'EPOCH_REQUIRED',
        serverEpoch: t.epoch,
      })
    })

    it('refuses a client synced against another lifetime of the database', async () => {
      const body = pushBody()
      const res = await push(
        body,
        t.headers({ 'x-dataset-epoch': randomUUID() }),
      )

      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({
        code: 'EPOCH_MISMATCH',
        serverEpoch: t.epoch,
      })
      await expect(
        prisma.contact.findUnique({ where: { id: body.recordId } }),
      ).resolves.toBeNull()
    })
  })

  describe('permanent rejections (4xx, the client must not retry)', () => {
    it('rejects a body that is not a replication envelope', async () => {
      const res = await push({})

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'INVALID_PAYLOAD' })
      expect(res.json().message).toContain('operationId')
    })

    it('rejects an unknown collection', async () => {
      const res = await push(pushBody({ collection: 'users' }))

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'INVALID_PAYLOAD' })
    })

    it('rejects an unknown operation', async () => {
      const res = await push(
        pushBody({ operation: 'upsert' as unknown as 'create' }),
      )

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'INVALID_PAYLOAD' })
    })

    it('rejects a record carrying a field the schema does not know', async () => {
      const record = contact({ bogusField: 1 })
      const res = await push(
        pushBody({ recordId: record.id, data: record }),
      )

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'INVALID_DATA' })
      expect(res.json().message).toContain('bogusField')
      await expect(
        prisma.contact.findUnique({ where: { id: record.id } }),
      ).resolves.toBeNull()
    })

    it('rejects an update of a record the server never received', async () => {
      const res = await push(
        pushBody({
          operation: 'update',
          recordId: randomUUID(),
          data: { city: 'Lyon' },
        }),
      )

      expect(res.statusCode).toBe(404)
      expect(res.json()).toMatchObject({ code: 'RECORD_NOT_FOUND' })
    })

    it('rejects a record pointing at a parent the server does not have', async () => {
      const article = {
        id: randomUUID(),
        category: 'SKI',
        discipline: 'ALPIN',
        brand: 'Rossignol',
        color: 'rouge',
        code: 'A-0001',
        year: 2020,
        depositIndex: 1,
        identificationLetter: 'A',
        articleIndex: 1,
        depositId: randomUUID(),
      }
      const res = await push(
        pushBody({ collection: 'articles', recordId: article.id, data: article }),
      )

      expect(res.statusCode).toBe(409)
      expect(res.json()).toMatchObject({ code: 'MISSING_REFERENCE' })
    })
  })

  describe('applying operations', () => {
    it('creates the record', async () => {
      const record = contact({ city: 'Grenoble' })
      const res = await push(pushBody({ recordId: record.id, data: record }))

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ applied: true, datasetEpoch: t.epoch })
      await expect(
        prisma.contact.findUnique({ where: { id: record.id } }),
      ).resolves.toMatchObject({
        lastName: 'Durand',
        city: 'Grenoble',
      })
    })

    it('accepts the same create twice (the first response was lost)', async () => {
      const body = pushBody()

      const first = await push(body)
      const second = await push(body)

      expect(first.statusCode).toBe(200)
      expect(second.statusCode).toBe(200)
      await expect(prisma.contact.count()).resolves.toBe(1)
    })

    it('updates the record', async () => {
      const record = contact()
      await push(pushBody({ recordId: record.id, data: record }))

      const res = await push(
        pushBody({
          operation: 'update',
          recordId: record.id,
          data: { city: 'Annecy' },
        }),
      )

      expect(res.statusCode).toBe(200)
      await expect(
        prisma.contact.findUnique({ where: { id: record.id } }),
      ).resolves.toMatchObject({ city: 'Annecy' })
    })

    it('soft-deletes the record, and accepts the same delete twice', async () => {
      const record = contact()
      await push(pushBody({ recordId: record.id, data: record }))
      const remove = () =>
        push(pushBody({ operation: 'delete', recordId: record.id, data: {} }))

      const first = await remove()
      const second = await remove()

      expect(first.statusCode).toBe(200)
      expect(second.statusCode).toBe(200)
      // The soft-delete extension hides deleted rows from the default reads.
      await expect(
        prisma.contact.findUnique({ where: { id: record.id } }),
      ).resolves.toBeNull()
      await expect(
        prisma.contact.findFirst({
          where: { id: record.id, deletedAt: { not: null } },
        }),
      ).resolves.toMatchObject({ id: record.id })
    })
  })
})
