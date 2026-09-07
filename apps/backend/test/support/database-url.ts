// Dedicated database on the same Postgres as development (docker-compose
// `cmr_postgres`), so the tests can truncate freely without touching cmr_db.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://cmr_user:cmr_password@localhost:15432/cmr_test?schema=public'
