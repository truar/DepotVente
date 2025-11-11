import type {
  PaginatedDeposits,
} from '@cmr-apps/types'
import { useAuthStore } from '@/stores/authStore'

export class ApiDepositsService {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // Utiliser getState() pour accéder au store en dehors d'un composant React
    const token = useAuthStore.getState().token

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getDeposits(page = 1, pageSize = 50): Promise<PaginatedDeposits> {
    return this.request<PaginatedDeposits>(
      `/api/admin/deposits?page=${page}&pageSize=${pageSize}`
    )
  }
}

export const depositsService = new ApiDepositsService()
