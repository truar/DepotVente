import { PaginatedResponse, UpdateSaleInput } from "@cmr-apps/types";
import type {
  ISalesRepository,
} from "../interfaces/ISalesRepository";
import { Sale } from "../../../../packages/types/src/generated";
import { salesEmitter } from "../events/SalesEmitter";

export class SalesService {
  constructor(private salesRepository: ISalesRepository) {}

  async getSales(page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<Sale>> {
    return this.salesRepository.findAll(page, pageSize);
  }

  async findById(id: string): Promise<Sale | null> {
    return this.salesRepository.findById(id);
  }

  async updateSale(id: string, data: UpdateSaleInput): Promise<Sale> {
    const sale = await this.salesRepository.update(id, data);
    salesEmitter.notifySalesChanged();
    return sale;
  }
}
