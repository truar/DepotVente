import type { FastifyInstance } from 'fastify'
import { prisma } from 'database'
import { Prisma } from 'database'

// Collections a client may push, mapped to their Prisma delegate. Must stay in
// step with the tables the frontend keeps in Dexie (apps/frontend/src/db.ts).
const delegates = {
  deposits: prisma.deposit,
  contacts: prisma.contact,
  articles: prisma.article,
  sales: prisma.sale,
  refunds: prisma.refund,
  predeposits: prisma.predeposit,
  predepositArticles: prisma.predepositArticle,
  cashRegisterControls: prisma.cashRegisterControl,
}

type Collection = keyof typeof delegates
const collections = Object.keys(delegates) as Collection[]

type ReplicationRequest = {
  operationId: string
  collection: Collection
  operation: 'create' | 'update' | 'delete'
  recordId: string
  data: Record<string, unknown>
  timestamp: number
}

// Envelope validation. A body that fails here is refused with 400
// INVALID_PAYLOAD and the client will not retry it.
const pushBodySchema = {
  type: 'object',
  required: ['operationId', 'collection', 'operation', 'recordId', 'data'],
  properties: {
    operationId: { type: 'string', minLength: 1 },
    collection: { type: 'string', enum: collections },
    operation: { type: 'string', enum: ['create', 'update', 'delete'] },
    recordId: { type: 'string', minLength: 1 },
    data: { type: 'object' },
    timestamp: { type: 'number' },
  },
} as const

export async function replicationRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ReplicationRequest }>(
    '/push',
    {
      schema: { body: pushBodySchema },
      onRequest: [fastify.authenticate, fastify.requireDatasetEpoch],
    },
    async (request) => {
      const { collection, operation, data, recordId, operationId } =
        request.body
      // Forwarded dynamically: the row shape is checked by Prisma, and a
      // mismatch surfaces as 400 INVALID_DATA through the error handler.
      const delegate = delegates[collection] as any
      const entityData = data as any

      switch (operation) {
        case 'create':
          try {
            await delegate.create({
              data: {
                ...entityData,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          } catch (err) {
            // P2002 = unique constraint. The original push reached the DB but
            // the client never saw the 200 (network drop). Treat the retry as
            // success so the outbox can drop the operation.
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === 'P2002'
            ) {
              request.log.info(
                { collection, recordId, operationId },
                'Duplicate create ignored (idempotent retry)',
              )
            } else {
              throw err
            }
          }
          break

        case 'update':
          await delegate.update({
            where: { id: recordId },
            data: {
              ...entityData,
              updatedAt: new Date(),
            },
          })
          break

        case 'delete':
          // Soft delete. Done by hand rather than through delegate.delete():
          // the softDelete extension forwards `data` to Prisma's delete,
          // which rejects it.
          try {
            await delegate.update({
              where: { id: recordId },
              data: { deletedAt: new Date(), updatedAt: new Date() },
            })
          } catch (err) {
            // P2025 = no live record with this id: already deleted by an
            // earlier attempt whose response was lost. Idempotent success.
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === 'P2025'
            ) {
              request.log.info(
                { collection, recordId, operationId },
                'Delete of a missing record ignored (idempotent retry)',
              )
            } else {
              throw err
            }
          }
          break
      }

      return { applied: true, datasetEpoch: fastify.datasetEpoch }
    },
  )
}
