import { DepositWithRelations, PaginatedResponse } from "@cmr-apps/types";

export interface IDepositsRepository {
  findAll(
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<DepositWithRelations>>;
}
