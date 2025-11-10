import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { StatsService } from "../services/StatsService";
import { PrismaStatsRepository } from "../repositories/PrismaStatsRepository";
import { statsEmitter } from "../events/StatsEmitter";

// Instancier le service avec le repository
const statsRepository = new PrismaStatsRepository();
const statsService = new StatsService(statsRepository);

export async function sseRoutes(fastify: FastifyInstance) {
  // SSE endpoint pour les stats en temps réel (event-driven)
  fastify.get(
    "/api/admin/stats/stream",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Configuration SSE avec headers CORS
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": request.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true",
      });

      // Fonction pour envoyer les stats
      const sendStats = async () => {
        try {
          const stats = await statsService.getDashboardStats();
          const message = `data: ${JSON.stringify(stats)}\n\n`;
          reply.raw.write(message);
        } catch (error) {
          fastify.log.error("Error sending stats:", error);
        }
      };

      // Envoyer les stats immédiatement
      await sendStats();

      // ✨ Event-driven: Envoyer les stats quand elles changent
      const onStatsChanged = async () => {
        await sendStats();
      };

      statsEmitter.onStatsChanged(onStatsChanged);

      // Nettoyer quand le client se déconnecte
      request.raw.on("close", () => {
        statsEmitter.offStatsChanged(onStatsChanged);
        reply.raw.end();
      });
    }
  );
}
