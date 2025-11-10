/**
 * Statistiques pour le dashboard admin
 */
export interface DashboardStats {
  totalUsers: number;
  activeDepots: number;
  todaySales: number;
  todayRevenue: number;
}

/**
 * Interface pour récupérer les statistiques
 */
export interface IStatsRepository {
  /**
   * Récupérer les statistiques du dashboard
   */
  getDashboardStats(): Promise<DashboardStats>;
}
