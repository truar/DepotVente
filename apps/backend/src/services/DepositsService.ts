import type {
  IDepositsRepository,
  PaginatedDeposits,
} from "../interfaces/IDepositsRepository";

export class DepositsService {
  constructor(private depositsRepository: IDepositsRepository) {}

  async getDeposits(page: number = 1, pageSize: number = 50): Promise<PaginatedDeposits> {
    return this.depositsRepository.findAll(page, pageSize);
  }
}
