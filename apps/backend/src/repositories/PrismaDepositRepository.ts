import { Prisma, prisma } from 'database';
import DepositUncheckedCreateInput = Prisma.DepositUncheckedCreateInput;

export class PrismaDepositRepository {
  async create(data: DepositUncheckedCreateInput) {
    return prisma.deposit.create({data})
  }
}
