import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { DepositsService } from "../services/DepositsService";
import { PrismaDepositsRepository } from "../repositories/PrismaDepositsRepository";
import { depositsEmitter } from "../events/DepositsEmitter";

const depositsRepository = new PrismaDepositsRepository();
const depositsService = new DepositsService(depositsRepository);

export async function depositsRoutes(fastify: FastifyInstance) {
  // SSE endpoint pour les dépôts en temps réel
  fastify.get(
    "/api/admin/deposits/stream",
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
        "X-Accel-Buffering": "no",
      });

      // Désactiver le buffering Node.js
      reply.raw.socket?.setNoDelay(true);

      // Envoyer un commentaire initial pour établir la connexion
      reply.raw.write(`: SSE connection established\n\n`);

      // Fonction pour envoyer les dépôts
      const sendDeposits = async () => {
        try {
          // Récupérer les query params pour la pagination
          const url = new URL(
            request.url,
            `http://${request.headers.host}`
          );
          const page = parseInt(url.searchParams.get("page") || "1");
          const pageSize = parseInt(
            url.searchParams.get("pageSize") || "50"
          );

          const deposits = await depositsService.getDeposits(page, pageSize);
          const message = `data: ${JSON.stringify(deposits)}\n\n`;
          reply.raw.write(message);
        } catch (error) {
          fastify.log.error("Error sending deposits:", error);
        }
      };

      // Envoyer les dépôts immédiatement
      await sendDeposits();

      // Event-driven: Envoyer les dépôts quand ils changent
      const onDepositsChanged = async () => {
        await sendDeposits();
      };

      depositsEmitter.onDepositsChanged(onDepositsChanged);

      // Nettoyer quand le client se déconnecte
      request.raw.on("close", () => {
        depositsEmitter.offDepositsChanged(onDepositsChanged);
        reply.raw.end();
      });
    }
  );

  // GET /api/admin/deposits - Liste paginée des dépôts
  fastify.get(
    "/api/admin/deposits",
    {
      onRequest: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{
        Querystring: { page?: string; pageSize?: string };
      }>
    ) => {
      const page = parseInt(request.query.page || "1");
      const pageSize = parseInt(request.query.pageSize || "50");
      return depositsService.getDeposits(page, pageSize);
    }
  );
}
