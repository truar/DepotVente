import { Global, Module, type OnApplicationShutdown } from '@nestjs/common'
import { prisma } from 'database'

// The extended Prisma client from the `database` package (soft delete +
// Decimal-to-number), exposed to the rest of the app under one token.
export const PRISMA = Symbol('PRISMA')
export type PrismaClient = typeof prisma

class PrismaLifecycle implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await prisma.$disconnect()
  }
}

@Global()
@Module({
  providers: [{ provide: PRISMA, useValue: prisma }, PrismaLifecycle],
  exports: [PRISMA],
})
export class PrismaModule {}
