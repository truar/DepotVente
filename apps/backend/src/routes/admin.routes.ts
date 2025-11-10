import type { FastifyInstance } from "fastify";
import { StatsService } from "../services/StatsService";
import { PrismaStatsRepository } from "../repositories/PrismaStatsRepository";

// Instancier le service avec le repository
const statsRepository = new PrismaStatsRepository();
const statsService = new StatsService(statsRepository);

export async function adminRoutes(fastify: FastifyInstance) {
  // Get dashboard statistics
  fastify.get(
    "/api/admin/stats",
    {
      onRequest: [fastify.authenticate],
    },
    async () => {
      return statsService.getDashboardStats();
    }
  );
}
