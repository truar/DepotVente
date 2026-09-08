import { ApiAuthService } from './implementations/ApiAuthService'
import type { IAuthService } from './interfaces/IAuthService'

// Re-export des types pour faciliter l'import
export type {
  User,
  LoginCredentials,
  LoginResponse,
  AuthenticatedUser,
} from './interfaces/IAuthService'

/**
 * Instance singleton du service d'authentification
 * Utilisez cette instance partout dans l'application
 */
export const authService: IAuthService = new ApiAuthService()
