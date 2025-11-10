import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SalesService } from "../services/SalesService";
import { PrismaSalesRepository } from "../repositories/PrismaSalesRepository";
import { salesEmitter } from "../events/SalesEmitter";
import type { CreateSaleDTO, UpdateSaleDTO } from "../interfaces/ISalesRepository";

const salesRepository = new PrismaSalesRepository();
const salesService = new SalesService(salesRepository);

export async function salesRoutes(fastify: FastifyInstance) {
  // SSE endpoint pour les ventes en temps réel
  fastify.get(
    "/api/admin/sales/stream",
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

      // Fonction pour envoyer les ventes
      const sendSales = async () => {
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

          const sales = await salesService.getSales(page, pageSize);
          const message = `data: ${JSON.stringify(sales)}\n\n`;
          reply.raw.write(message);
        } catch (error) {
          fastify.log.error("Error sending sales:", error);
        }
      };

      // Envoyer les ventes immédiatement
      await sendSales();

      // Event-driven: Envoyer les ventes quand elles changent
      const onSalesChanged = async () => {
        await sendSales();
      };

      salesEmitter.onSalesChanged(onSalesChanged);

      // Nettoyer quand le client se déconnecte
      request.raw.on("close", () => {
        salesEmitter.offSalesChanged(onSalesChanged);
        reply.raw.end();
      });
    }
  );

  // GET /api/admin/sales - Liste paginée des ventes
  fastify.get(
    "/api/admin/sales",
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
      return salesService.getSales(page, pageSize);
    }
  );

  // GET /api/admin/sales/:id - Détail d'une vente
  fastify.get(
    "/api/admin/sales/:id",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      const sale = await salesService.getSaleById(request.params.id);
      if (!sale) {
        return { error: "Sale not found" };
      }
      return sale;
    }
  );

  // POST /api/admin/sales - Créer une vente
  fastify.post(
    "/api/admin/sales",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: FastifyRequest<{ Body: CreateSaleDTO }>) => {
      const sale = await salesService.createSale(request.body);
      return sale;
    }
  );

  // PUT /api/admin/sales/:id - Modifier une vente
  fastify.put(
    "/api/admin/sales/:id",
    {
      onRequest: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateSaleDTO;
      }>
    ) => {
      const sale = await salesService.updateSale(
        request.params.id,
        request.body
      );
      return sale;
    }
  );

  // DELETE /api/admin/sales/:id - Supprimer une vente
  fastify.delete(
    "/api/admin/sales/:id",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      await salesService.deleteSale(request.params.id);
      return { success: true };
    }
  );
}
