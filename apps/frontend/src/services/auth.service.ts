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
 * Type de service d'authentification
 * Permet de basculer facilement entre différentes implémentations
 */
type AuthServiceType = 'api' | 'supabase' | 'firebase'

/**
 * Factory pour créer le service d'authentification approprié
 * Basé sur la variable d'environnement VITE_AUTH_PROVIDER
 */
function createAuthService(): IAuthService {
  const authProvider =
    (import.meta.env.VITE_AUTH_PROVIDER as AuthServiceType) || 'api'

  switch (authProvider) {
    case 'api':
      return new ApiAuthService()

    // case 'supabase':
    //   return new SupabaseAuthService()

    // case 'firebase':
    //   return new FirebaseAuthService()

    default:
      console.warn(
        `Unknown auth provider: ${authProvider}, falling back to API`,
      )
      return new ApiAuthService()
  }
}

/**
 * Instance singleton du service d'authentification
 * Utilisez cette instance partout dans l'application
 */
export const authService: IAuthService = createAuthService()
