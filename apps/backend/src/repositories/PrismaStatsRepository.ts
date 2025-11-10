import { prisma } from "database";
import type {
  IStatsRepository,
  DashboardStats,
} from "../interfaces/IStatsRepository";

/**
 * Implémentation Prisma du repository de statistiques
 */
export class PrismaStatsRepository implements IStatsRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Récupérer les stats en parallèle pour optimiser les performances
    const [totalUsers, activeDepots, todaySales, todayRevenueResult] =
      await Promise.all([
        // Total utilisateurs
        prisma.user.count({
          where: {
            deletedAt: null,
          },
        }),

        // Dépôts en statut VALIDE (validés)
        prisma.deposit.count({
          where: {
            status: "VALIDE",
            deletedAt: null,
          },
        }),

        // Ventes du jour (utilise saleAt au lieu de createdAt)
        prisma.sale.count({
          where: {
            saleAt: {
              gte: startOfDay,
            },
            deletedAt: null,
          },
        }),

        // CA du jour (somme des totalAmount des ventes)
        prisma.sale.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            saleAt: {
              gte: startOfDay,
            },
            deletedAt: null,
          },
        }),
      ]);

    // Convertir Decimal en number
    const todayRevenue = todayRevenueResult._sum.totalAmount
      ? Number(todayRevenueResult._sum.totalAmount)
      : 0;

    return {
      totalUsers,
      activeDepots,
      todaySales,
      todayRevenue,
    };
  }
}
