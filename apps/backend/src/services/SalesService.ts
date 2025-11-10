import type {
  ISalesRepository,
  PaginatedSales,
  SaleWithItems,
  CreateSaleDTO,
  UpdateSaleDTO,
} from "../interfaces/ISalesRepository";

export class SalesService {
  constructor(private salesRepository: ISalesRepository) {}

  async getSales(page: number = 1, pageSize: number = 50): Promise<PaginatedSales> {
    return this.salesRepository.findAll(page, pageSize);
  }

  async getSaleById(id: string): Promise<SaleWithItems | null> {
    return this.salesRepository.findById(id);
  }

  async createSale(data: CreateSaleDTO): Promise<SaleWithItems> {
    return this.salesRepository.create(data);
  }

  async updateSale(id: string, data: UpdateSaleDTO): Promise<SaleWithItems> {
    return this.salesRepository.update(id, data);
  }

  async deleteSale(id: string): Promise<void> {
    return this.salesRepository.delete(id);
  }
}
