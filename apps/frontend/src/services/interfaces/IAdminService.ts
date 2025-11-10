/**
 * Statistiques du dashboard admin
 */
export interface DashboardStats {
  totalUsers: number
  activeDepots: number
  todaySales: number
  todayRevenue: number
}

/**
 * Interface pour les services admin
 */
export interface IAdminService {
  /**
   * Récupérer les statistiques du dashboard
   */
  getDashboardStats: () => Promise<DashboardStats>
}
