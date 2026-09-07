import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from 'database'
import { readClientContext } from './client-context.js'

declare module 'fastify' {
  interface FastifyInstance {
    // Identifier of this database's current lifetime, see the DatasetEpoch
    // model. Loaded once at boot.
    datasetEpoch: string
    // onRequest hook: refuse requests from clients that synced against a
    // previous lifetime of the database.
    requireDatasetEpoch: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

async function loadOrCreateEpoch(): Promise<string> {
  const existing = await prisma.datasetEpoch.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  if (existing) return existing.id
  const created = await prisma.datasetEpoch.create({ data: {} })
  return created.id
}

export async function registerDatasetEpoch(fastify: FastifyInstance) {
  const epoch = await loadOrCreateEpoch()
  fastify.decorate('datasetEpoch', epoch)
  fastify.log.info({ datasetEpoch: epoch }, 'Dataset epoch loaded')

  fastify.decorate(
    'requireDatasetEpoch',
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { datasetEpoch } = readClientContext(request.raw)

      if (!datasetEpoch) {
        request.log.warn('Request without dataset epoch refused')
        return reply.code(400).send({
          code: 'EPOCH_REQUIRED',
          message: 'Le client doit indiquer son epoch de données.',
          serverEpoch: epoch,
        })
      }

      if (datasetEpoch !== epoch) {
        request.log.warn(
          { clientEpoch: datasetEpoch },
          'Client synced against a previous database, refused',
        )
        return reply.code(409).send({
          code: 'EPOCH_MISMATCH',
          message:
            'La base de données du serveur a été réinitialisée depuis la dernière synchronisation de ce poste.',
          serverEpoch: epoch,
        })
      }
    },
  )
}
