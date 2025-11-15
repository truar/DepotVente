import { prisma } from "database";
import type { User, CreateUserInput, UpdateUserInput } from "@cmr-apps/types";
import type { IUserRepository } from "../interfaces/IUserRepository";

/**
 * Implémentation Prisma du repository utilisateur
 */
export class PrismaUserRepository implements IUserRepository {
  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        email: { equals: email },
      },
    });
  }

  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }
}
