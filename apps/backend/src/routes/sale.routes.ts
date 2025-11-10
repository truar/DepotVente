import type { FastifyInstance } from "fastify";
import { prisma } from "database";
import { statsEmitter } from "../events/StatsEmitter";

export async function saleRoutes(fastify: FastifyInstance) {
  // Créer une vente (et notifier les clients SSE)
  fastify.post(
    "/api/sales",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const {
        eventId,
        userId,
        workstationId,
        checkoutId,
        totalAmount,
        cashAmount,
        cardAmount,
        checkAmount,
      } = request.body as {
        eventId: string;
        userId: string;
        workstationId: string;
        checkoutId: string;
        totalAmount: number;
        cashAmount: number;
        cardAmount: number;
        checkAmount: number;
      };

      // Créer la vente
      const sale = await prisma.sale.create({
        data: {
          eventId,
          userId,
          workstationId,
          checkoutId,
          totalAmount,
          cashAmount,
          cardAmount,
          checkAmount,
          saleAt: new Date(),
        },
      });

      // ✨ Notifier tous les clients connectés en SSE
      statsEmitter.notifyStatsChanged();

      reply.code(201);
      return sale;
    }
  );
}
