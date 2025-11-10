import { prisma } from "database";
import type {
  ISalesRepository,
  PaginatedSales,
} from "../interfaces/ISalesRepository";

export class PrismaSalesRepository implements ISalesRepository {
  async findAll(page: number, pageSize: number): Promise<PaginatedSales> {
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
      sales: sales.map((sale) => ({
        ...sale,
        articles: sale.articles.map((item) => ({
          ...item,
          unitPrice: Number(item.price),
        })),
      })),
      total,
      page,
      pageSize,
    };
  }
}
