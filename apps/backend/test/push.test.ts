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

    // 2 € per started block of five articles: a seller bringing 26 articles
    // owes 12 €, past what a two-digit amount can hold.
    it('stores a contribution of ten euros or more', async () => {
      const seller = contact()
      await push(pushBody({ recordId: seller.id, data: seller }))
      const deposit = {
        id: randomUUID(),
        sellerId: seller.id,
        contributionStatus: 'A_PAYER',
        contributionAmount: 12,
        depositIndex: 100,
        incrementStart: 0,
        dropWorkstationId: 1,
        type: 'PARTICULIER',
      }

      const res = await push(
        pushBody({ collection: 'deposits', recordId: deposit.id, data: deposit }),
      )

      expect(res.statusCode).toBe(200)
      const stored = await prisma.deposit.findUnique({
        where: { id: deposit.id },
      })
      expect(Number(stored?.contributionAmount)).toBe(12)
    })

    // « Message caisse »: written on the edit screen, read by the tills when
    // the article is scanned.
    it('stores the message left on an article for the tills', async () => {
      const seller = contact()
      await push(pushBody({ recordId: seller.id, data: seller }))
      const deposit = {
        id: randomUUID(),
        sellerId: seller.id,
        contributionStatus: 'PAYE',
        contributionAmount: 2,
        depositIndex: 100,
        incrementStart: 0,
        dropWorkstationId: 1,
        type: 'PARTICULIER',
      }
      await push(
        pushBody({ collection: 'deposits', recordId: deposit.id, data: deposit }),
      )
      const article = {
        id: randomUUID(),
        depositId: deposit.id,
        price: 120,
        category: 'Skis',
        discipline: 'Alpin',
        brand: 'Rossignol',
        color: 'rouge',
        code: '2026 100A',
        year: 2023,
        depositIndex: 100,
        identificationLetter: 'A',
        articleIndex: 0,
        status: 'RECEPTION_OK',
      }
      await push(
        pushBody({ collection: 'articles', recordId: article.id, data: article }),
      )

      const res = await push(
        pushBody({
          collection: 'articles',
          operation: 'update',
          recordId: article.id,
          data: { saleAlert: 'Vendu sans les bâtons' },
        }),
      )

      expect(res.statusCode).toBe(200)
      await expect(
        prisma.article.findUnique({ where: { id: article.id } }),
      ).resolves.toMatchObject({ saleAlert: 'Vendu sans les bâtons' })
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
