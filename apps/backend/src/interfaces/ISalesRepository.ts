import { Sale } from "../../../../packages/types/src/generated";

export type PaginatedSales = {
  sales: Sale[];
  total: number;
  page: number;
  pageSize: number;
};

export interface ISalesRepository {
  findAll(page: number, pageSize: number): Promise<PaginatedSales>;

}
