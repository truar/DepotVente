/**
 * Client HTTP générique pour les appels API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { params, ...fetchOptions } = options

    // Construire l'URL avec les paramètres query
    const url = new URL(`${this.baseURL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    // Récupérer le token depuis le localStorage
    const authStorage = localStorage.getItem('auth-storage')
    const token = authStorage ? JSON.parse(authStorage).state?.token : null

    // Headers par défaut
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    }

    // Ajouter le token si disponible
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    })

    // Gérer les erreurs HTTP
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }))
      throw new Error(error.message || error.error || 'Une erreur est survenue')
    }

    // Gérer les réponses vides (204 No Content)
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }
}

// Instance singleton du client API
export const apiClient = new ApiClient(API_BASE_URL)
