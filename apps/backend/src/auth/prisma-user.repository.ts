import { Inject, Injectable } from '@nestjs/common'
import type { User, CreateUserInput, UpdateUserInput } from '@cmr-apps/types'
import { PRISMA, type PrismaClient } from '../prisma/prisma.module.js'
import type { IUserRepository } from './user-repository.interface.js'

/**
 * Implémentation Prisma du repository utilisateur
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email: { equals: email } } })
  }

  async create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data })
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }

  async count(): Promise<number> {
    return this.prisma.user.count()
  }
}
