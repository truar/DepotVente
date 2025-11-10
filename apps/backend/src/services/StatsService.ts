import type {
  IStatsRepository,
  DashboardStats,
} from "../interfaces/IStatsRepository";

/**
 * Service métier pour les statistiques
 */
export class StatsService {
  constructor(private statsRepository: IStatsRepository) {}

  async getDashboardStats(): Promise<DashboardStats> {
    return this.statsRepository.getDashboardStats();
  }
}
