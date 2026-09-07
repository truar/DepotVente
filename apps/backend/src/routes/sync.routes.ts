import type { FastifyInstance } from 'fastify';
import { prisma } from 'database';

export async function syncRoutes(fastify: FastifyInstance) {

  // Initial sync: Full data dump for a workstation
  fastify.get(
    '/sync/initial',
    {
      onRequest: [fastify.authenticate],
    },
    async () => {
      const syncedAt = Date.now();
      // Fetch all relevant data for this workstation
      const [deposits, articles, contacts, sales, refunds, predeposits, predepositArticles, cashRegisterControls] = await Promise.all([
        prisma.deposit.findMany(),
        prisma.article.findMany(),
        prisma.contact.findMany(),
        prisma.sale.findMany(),
        prisma.refund.findMany(),
        prisma.predeposit.findMany(),
        prisma.predepositArticle.findMany(),
        prisma.cashRegisterControl.findMany(),
      ]);

      return {
        deposits,
        articles,
        contacts,
        sales,
        refunds,
        predeposits,
        predepositArticles,
        cashRegisterControls,
        syncedAt,
        datasetEpoch: fastify.datasetEpoch,
      };
    }
  );

  // Delta sync: Changes since timestamp
  fastify.get<{ Querystring: { since?: string } }>(
    '/sync/delta',
    {
      onRequest: [fastify.authenticate, fastify.requireDatasetEpoch],
    },
    async (request, reply) => {
      const { since } = request.query
      const syncedAt = Date.now();

      const sinceMs = Number(since);
      if (!since || !Number.isFinite(sinceMs)) {
        return reply.code(400).send({
          code: 'INVALID_SINCE',
          message: 'since doit être un timestamp en millisecondes',
        });
      }

      const sinceDate = new Date(sinceMs);

      // Fetch changes since timestamp
      const [deposits, articles, contacts, sales, refunds, predeposits, predepositArticles, cashRegisterControls] = await Promise.all([
        prisma.deposit.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
        prisma.article.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
        prisma.contact.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
        prisma.sale.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
        prisma.refund.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
        prisma.predeposit.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
        prisma.predepositArticle.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
        prisma.cashRegisterControl.findMany({
          where: {
            updatedAt: { gte: sinceDate },
          },
        }),
      ])

      return {
        deposits,
        articles,
        contacts,
        sales,
        refunds,
        predeposits,
        predepositArticles,
        cashRegisterControls,
        syncedAt,
        datasetEpoch: fastify.datasetEpoch,
      };
    }
  );
  // Health check endpoint. Also how a client learns the current epoch before
  // its first push.
  fastify.get('/sync/ping', async () => {
    return {
      status: 'ok',
      timestamp: Date.now(),
      datasetEpoch: fastify.datasetEpoch,
    };
  });
}
