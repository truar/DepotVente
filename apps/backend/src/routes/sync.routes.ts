import type { FastifyInstance } from 'fastify';
import { prisma } from 'database';

export async function syncRoutes(fastify: FastifyInstance) {

  // Initial sync: Full data dump for a workstation
  fastify.get(
    '/api/sync/initial',
    {
      onRequest: [fastify.authenticate],
    },
    async () => {
      const syncedAt = Date.now();
      // Fetch all relevant data for this workstation
      const [deposits, articles, contacts, sales, predeposits, predepositArticles] = await Promise.all([
        prisma.deposit.findMany(),
        prisma.article.findMany(),
        prisma.contact.findMany(),
        prisma.sale.findMany(),
        prisma.predeposit.findMany(),
        prisma.predepositArticle.findMany(),
      ]);

      return {
        deposits,
        articles,
        contacts,
        sales,
        predeposits,
        predepositArticles,
        syncedAt,
      };
    }
  );

  // Delta sync: Changes since timestamp
  fastify.get<{ Querystring: { since?: string } }>(
    '/api/sync/delta',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { since } = request.query
      const syncedAt = Date.now();

      if (!since) {
        return reply.code(400).send({ error: 'since is required' });
      }

      const sinceDate = new Date(parseInt(since));

      // Fetch changes since timestamp
      const [deposits, articles, contacts, sales, predeposits, predepositArticles] = await Promise.all([
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
      ])

      return {
        deposits,
        articles,
        contacts,
        sales,
        predeposits,
        predepositArticles,
        syncedAt,
      };
    }
  );
  // Health check endpoint
  fastify.get('/api/sync/ping', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });
}
