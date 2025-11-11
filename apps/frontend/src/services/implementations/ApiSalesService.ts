import { useAuthStore } from '@/stores/authStore'
import type { PaginatedResponse, SaleWithRelations, UpdateSaleInput } from '@cmr-apps/types'

export class ApiSalesService {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
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

  async getSales(page = 1, pageSize = 50): Promise<PaginatedResponse<SaleWithRelations>> {
    return this.request<PaginatedResponse<SaleWithRelations>>(
      `/api/admin/sales?page=${page}&pageSize=${pageSize}`,
    )
  }

  async getSaleById(id: string): Promise<SaleWithRelations> {
    return this.request<SaleWithRelations>(`/api/admin/sales/${id}`)
  }

  async updateSale(id: string, data: UpdateSaleInput): Promise<SaleWithRelations> {
    return this.request<SaleWithRelations>(`/api/admin/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSale(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/api/admin/sales/${id}`, {
      method: 'DELETE',
    })
  }
}

export const salesService = new ApiSalesService()
