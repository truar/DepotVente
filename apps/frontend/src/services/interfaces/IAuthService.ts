import type { User } from '@cmr-apps/types'

/**
 * Interface commune pour tous les services d'authentification
 * Permet de changer facilement d'implémentation (API REST, Supabase, Firebase, etc.)
 */

// Re-export du type User pour faciliter l'import
export type { User }

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface AuthenticatedUser {
  payload: User
}

/**
 * Contrat que TOUTES les implémentations d'authentification doivent respecter
 */
export interface IAuthService {
  /**
   * Connexion de l'utilisateur
   * @param credentials - Email et mot de passe
   * @returns Token d'authentification
   */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>

  /**
   * Récupérer les informations de l'utilisateur connecté
   * @returns Données de l'utilisateur authentifié
   */
  getCurrentUser: () => Promise<AuthenticatedUser>

  /**
   * Déconnexion de l'utilisateur
   */
  logout: () => Promise<void>

  /**
   * Vérifier si le token est toujours valide
   * @returns true si le token est valide, false sinon
   */
  verifyToken: () => Promise<boolean>
}
