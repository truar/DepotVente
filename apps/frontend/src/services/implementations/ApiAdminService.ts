import { apiClient } from '@/lib/api-client'
import type {
  IAdminService,
  DashboardStats,
} from '@/services/interfaces/IAdminService'

/**
 * Implémentation API REST du service admin
 */
export class ApiAdminService implements IAdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/api/admin/stats')
  }
}
