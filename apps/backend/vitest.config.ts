import { defineConfig } from 'vitest/config'
import { TEST_DATABASE_URL } from './test/support/database-url'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Creates the test database and applies the migrations, once per run.
    globalSetup: ['test/support/global-setup.ts'],
    // The Prisma client reads DATABASE_URL when the `database` package is
    // first imported, so it has to be set before any test file loads.
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      NODE_ENV: 'test',
    },
    // Every file shares the one test database and truncates it between
    // tests, so files cannot run side by side.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 60_000,
  },
})
