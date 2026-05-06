// Convert every Prisma `Decimal` returned by a query into a plain JS `number`,
// recursively (handles nested includes and arrays).
//
// Why: PostgreSQL `NUMERIC`/`DECIMAL` columns are returned by Prisma as
// `Decimal` instances (decimal.js) to preserve arbitrary precision. When
// Fastify serializes the response, `Decimal.toJSON()` produces a string —
// forcing the frontend to `parseFloat` every amount. All money columns in
// this schema are `Decimal(10, 2)` (max ≈ 99,999,999.99), well within
// `Number.MAX_SAFE_INTEGER`, so converting to `number` is safe.

import { Prisma } from '../../generated/client/index.js'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function convert(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Prisma.Decimal.isDecimal(value)) return value.toNumber()
  if (Array.isArray(value)) return value.map(convert)
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const key in value) out[key] = convert(value[key])
    return out
  }
  return value
}

export const decimalToNumberExtension = Prisma.defineExtension({
  name: 'decimalToNumber',
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const result = await query(args)
        return convert(result)
      },
    },
  },
})
