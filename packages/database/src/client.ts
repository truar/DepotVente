import { PrismaClient } from '../generated/client'
import { softDeleteExtension } from './extensions/soft-delete'

// Extension du type global pour le stockage du client Prisma
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>
}

// Créer une instance unique de PrismaClient avec extension de soft delete
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Appliquer l'extension de soft delete
  return client.$extends(softDeleteExtension)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// En développement, stocker l'instance dans global pour éviter la création de multiples instances
// lors du hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Exporter un type pour le client Prisma étendu
export type ExtendedPrismaClient = typeof prisma
