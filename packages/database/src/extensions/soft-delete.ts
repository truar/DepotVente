// Custom Prisma client extension for soft delete functionality
// Simple implementation that works with our custom Prisma client output location

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Prisma } from '../../generated/client'

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async delete({ args, query }) {
        // Convert delete to update with deletedAt
        return (query as any)({
          ...args,
          data: { deletedAt: new Date() },
        })
      },

      async deleteMany({ args, query }) {
        // Convert deleteMany to updateMany with deletedAt
        return (query as any)({
          ...args,
          data: { deletedAt: new Date() },
        })
      },

      async findUnique({ args, query }) {
        // Only return non-deleted records
        const newArgs = { ...args } as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },

      async findFirst({ args, query }) {
        // Only return non-deleted records
        const newArgs = args ? { ...args } : {} as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },

      async findMany({ args, query }) {
        // Only return non-deleted records
        const newArgs = args ? { ...args } : {} as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },

      async update({ args, query }) {
        // Only update non-deleted records
        const newArgs = { ...args } as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },

      async updateMany({ args, query }) {
        // Only update non-deleted records
        const newArgs = args ? { ...args } : {} as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },

      async count({ args, query }) {
        // Only count non-deleted records
        const newArgs = args ? { ...args } : {} as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },

      async aggregate({ args, query }) {
        // Only aggregate non-deleted records
        const newArgs = args ? { ...args } : {} as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },

      async groupBy({ args, query }) {
        // Only group non-deleted records
        const newArgs = args ? { ...args } : {} as any
        if (!newArgs.where) newArgs.where = {}
        if (newArgs.where.deletedAt === undefined) {
          newArgs.where.deletedAt = null
        }
        return query(newArgs)
      },
    },
  },
})
