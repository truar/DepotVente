import type {
  PaginatedSales,
  SaleWithItems,
  CreateSaleDTO,
  UpdateSaleDTO,
} from '@cmr-apps/types'

export class ApiSalesService {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = localStorage.getItem('token')

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

  async getSales(page = 1, pageSize = 50): Promise<PaginatedSales> {
    return this.request<PaginatedSales>(
      `/api/admin/sales?page=${page}&pageSize=${pageSize}`
    )
  }

  async getSaleById(id: string): Promise<SaleWithItems> {
    return this.request<SaleWithItems>(`/api/admin/sales/${id}`)
  }

  async createSale(data: CreateSaleDTO): Promise<SaleWithItems> {
    return this.request<SaleWithItems>('/api/admin/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSale(id: string, data: UpdateSaleDTO): Promise<SaleWithItems> {
    return this.request<SaleWithItems>(`/api/admin/sales/${id}`, {
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
