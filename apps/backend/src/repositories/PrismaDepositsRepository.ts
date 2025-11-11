import { prisma } from "database";
import type {
  IDepositsRepository,
} from "../interfaces/IDepositsRepository";
import { DepositWithRelations, PaginatedResponse } from "@cmr-apps/types";

export class PrismaDepositsRepository implements IDepositsRepository {
  async findAll(page: number, pageSize: number): Promise<PaginatedResponse<DepositWithRelations>> {
    const skip = (page - 1) * pageSize;

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          articles: {
            where: {
              deletedAt: null,
            },
          },
          workstation: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.deposit.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: deposits,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
