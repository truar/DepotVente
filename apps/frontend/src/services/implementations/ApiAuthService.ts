import type {
  AuthenticatedUser,
  IAuthService,
  LoginCredentials,
  LoginResponse,
} from '@/services/interfaces/IAuthService'
import { apiClient } from '@/lib/api-client'

/**
 * Implémentation du service d'authentification via API REST
 */
export class ApiAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/signin', credentials)
  }

  async getCurrentUser(): Promise<AuthenticatedUser> {
    return apiClient.get<AuthenticatedUser>('/protected')
  }

  async logout(): Promise<void> {
    await apiClient.post('/logout', {})
  }

  async verifyToken(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch {
      return false
    }
  }
}
