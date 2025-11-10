import { ApiAdminService } from './implementations/ApiAdminService'
import type { IAdminService } from './interfaces/IAdminService'

// Re-export des types pour faciliter l'import
export type { DashboardStats } from './interfaces/IAdminService'

/**
 * Instance singleton du service admin
 * Utilisez cette instance partout dans l'application
 */
export const adminService: IAdminService = new ApiAdminService()
