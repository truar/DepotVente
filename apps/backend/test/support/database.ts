import { prisma } from 'database'

// Empty every table. `keepEpoch` preserves the dataset_epochs row so that a
// running app's epoch stays valid; pass false to simulate a database reset.
export async function truncateAll({ keepEpoch = true } = {}) {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  const tables = rows
    .map((row) => row.tablename)
    .filter((name) => !keepEpoch || name !== 'dataset_epochs')
    .map((name) => `"${name}"`)
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.join(', ')} CASCADE`)
}

export { prisma }
