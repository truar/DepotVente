import type { FastifyInstance } from 'fastify';
import { prisma } from 'database';
import { Prisma } from 'database';

type ReplicationRequest = {
  operationId: string
  collection: 'deposits' | 'contacts' | 'articles'
  operation: 'create' | 'update'
  recordId: string
  data: unknown
  timestamp: number
}

export async function replicationRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ReplicationRequest }>('/push', async (request) => {
    const { collection, operation, data, recordId } = request.body
    // Map collection names to Prisma delegates
    const delegates = {
      deposits: prisma.deposit,
      contacts: prisma.contact,
      articles: prisma.article,
      sales: prisma.sale,
      refunds: prisma.refund,
      predeposits: prisma.predeposit,
      cashRegisterControls: prisma.cashRegisterControl,
    }
    const delegate = delegates[collection] as any

    if (!delegate) {
      // fastify.log.warn(`Unknown collection: ${collection}`)
      return
    }

    // We treat data as 'any' here because we are forwarding it dynamically.
    // Prisma validation will still occur at the database level.
    const entityData = data as any

    if (operation === 'create') {
      try {
        await delegate.create({
          data: {
            ...entityData,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      } catch (err) {
        // P2002 = unique constraint. The original push reached the DB but the
        // client never saw the 200 (network drop). Treat the retry as success
        // so the outbox can drop the operation.
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          fastify.log.info(
            { collection, recordId },
            'Duplicate create ignored (idempotent retry)',
          )
        } else {
          throw err
        }
      }
    } else if (operation === 'update') {
      await delegate.update({
        where: { id: recordId },
        data: {
          ...entityData,
          updatedAt: new Date(),
        },
      })
    }
  })
}
