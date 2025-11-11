import {
  PaginatedResponse,
  SaleWithRelations,
  UpdateSaleInput
} from "@cmr-apps/types";

export interface ISalesRepository {
  findAll(page: number, pageSize: number): Promise<PaginatedResponse<SaleWithRelations>>;
  findById(id: string): Promise<SaleWithRelations | null>;
  update(id: string, data: UpdateSaleInput): Promise<SaleWithRelations>;
}
