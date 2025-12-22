import type { FastifyInstance } from 'fastify';
import { prisma } from 'database';

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
      await delegate.create({
        data: {
          ...entityData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
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
