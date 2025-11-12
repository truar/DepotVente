import type { FastifyInstance } from 'fastify';
import { prisma, Prisma } from 'database';
import DepositUncheckedCreateInput = Prisma.DepositUncheckedCreateInput;
import ContactUncheckedCreateInput = Prisma.ContactUncheckedCreateInput;
import ArticleUncheckedCreateInput = Prisma.ArticleUncheckedCreateInput;

type ReplicationRequest = {
  operationId: string
  collection: 'deposits' | 'contacts' | 'articles'
  operation: string
  recordId: string
  data: unknown
  timestamp: number
}

export async function replicationRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ReplicationRequest }>('/push', async (request) => {
    const { operationId, collection, operation, data, timestamp } = request.body
    console.log(operationId, collection, operation, data, timestamp)
    if (collection === 'deposits') {
      let depositData = data as DepositUncheckedCreateInput
      await prisma.deposit.upsert({
        where: {id: depositData.id},
        create: {
          ...depositData
        },
        update: {
          ...depositData
        }
      })
    } else if (collection === 'contacts') {
      let contactData = data as ContactUncheckedCreateInput
      await prisma.contact.upsert({
        where: {id: contactData.id},
        create: {
          ...contactData
        },
        update: {
          ...contactData
        }
      })
    } else if (collection === 'articles') {
      let articleData = data as ArticleUncheckedCreateInput
      await prisma.article.upsert({
        where: {id: articleData.id},
        create: {
          ...articleData
        },
        update: {
          ...articleData
        }
      })
    }
  })
}
