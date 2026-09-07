import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { TEST_DATABASE_URL } from './database-url'

const databasePackageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../packages/database',
)

// Runs once before the whole test run: make sure the test database exists
// and carries the current migrations. Same migrations, same Postgres image
// as production: nothing is stubbed.
export default async function setup() {
  const target = new URL(TEST_DATABASE_URL)
  const databaseName = target.pathname.slice(1)

  const maintenance = new URL(TEST_DATABASE_URL)
  maintenance.pathname = '/postgres'
  maintenance.search = ''

  const client = new pg.Client({ connectionString: maintenance.toString() })
  await client.connect()
  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    )
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${databaseName}"`)
    }
  } finally {
    await client.end()
  }

  execSync('pnpm exec prisma migrate deploy', {
    cwd: databasePackageDir,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  })
}
