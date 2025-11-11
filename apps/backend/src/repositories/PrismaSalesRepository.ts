import { prisma } from "database";
import type { ISalesRepository } from "../interfaces/ISalesRepository";
import { PaginatedResponse, SaleWithRelations, UpdateSaleInput } from "@cmr-apps/types";

export class PrismaSalesRepository implements ISalesRepository {
  async findAll(
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<SaleWithRelations>> {
    const skip = (page - 1) * pageSize;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
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
        },
        orderBy: {
          saleAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.sale.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: sales,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<SaleWithRelations | null> {
    const sale = await prisma.sale.findUnique({
      where: {
        id,
      },
      include: {
        articles: {
          where: {
            deletedAt: null,
          },
          include: {
            sale: true,
            deposit: true,
          },
        },
        workstation: true,
      },
    });

    if (!sale || sale.deletedAt) {
      return null;
    }

    return sale;
  }

  async update(id: string, data: UpdateSaleInput): Promise<SaleWithRelations> {
    // Calculate total from payment amounts
    const totalAmount =
      (data.cashAmount ?? 0) +
      (data.cardAmount ?? 0) +
      (data.checkAmount ?? 0);

    const sale = await prisma.sale.update({
      where: {
        id,
      },
      data: {
        cashAmount: data.cashAmount ?? 0,
        cardAmount: data.cardAmount ?? 0,
        checkAmount: data.checkAmount ?? 0,
        totalAmount,
      },
      include: {
        articles: {
          where: {
            deletedAt: null,
          },
        },
        workstation: true,
      },
    });

    return sale;
  }
}
