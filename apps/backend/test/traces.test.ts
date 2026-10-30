import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { truncateAll } from './support/database'
import {
  CLIENT,
  createTestApp,
  pushBody,
  type LogLine,
  type TestApp,
} from './support/test-app'

// `pnpm traces` reads what this backend logs. The lines it is fed here are the
// ones the real application wrote for real requests, so a change to the log
// format that would blind the supervision screens fails here.
const TRACES = fileURLToPath(new URL('../../../scripts/traces.mjs', import.meta.url))

describe('pnpm traces', () => {
  let t: TestApp
  let dir: string

  beforeAll(async () => {
    t = await createTestApp()
    await truncateAll()
    dir = mkdtempSync(path.join(tmpdir(), 'traces-'))
  })
  afterAll(async () => {
    await t.app.close()
    rmSync(dir, { recursive: true, force: true })
  })

  // Runs the tool over the given lines, as `--file` would over a saved log.
  // Not a terminal: no colours to strip.
  function traces(args: string[], lines: LogLine[]) {
    const file = path.join(dir, `${randomUUID()}.log`)
    writeFileSync(file, lines.map((line) => JSON.stringify(line)).join('\n'))
    return execFileSync(process.execPath, [TRACES, ...args, '--file', file], {
      encoding: 'utf8',
    })
  }

  // The lines of the last request to `url`, from the guard's to pino-http's.
  function linesOfLastRequest(url: string) {
    const last = t.logs.findLast((line) => line.req?.url === url && isRequest(line))
    return t.logs.filter((line) => line.req?.id === last?.req?.id)
  }
  const isRequest = (line: LogLine) =>
    typeof line.msg === 'string' && line.msg.startsWith('request ')

  async function push(
    body: ReturnType<typeof pushBody>,
    headers?: Record<string, string>,
  ) {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/push',
      headers: t.headers(headers),
      payload: body,
    })
    return { status: res.statusCode, lines: linesOfLastRequest('/api/push') }
  }

  // A push refused for good: the guard, the exception filter and pino-http
  // each write a line.
  async function refusedPush() {
    return push(pushBody(), { 'x-dataset-epoch': randomUUID() })
  }

  // A push the server failed on: the record id is not a uuid, Postgres
  // refuses the lookup, and the exception filter has no code for that error.
  async function failedPush() {
    return push(pushBody({ operation: 'update', recordId: 'not-a-uuid' }))
  }

  // pino-http writes this when the PC hangs up before the answer (network
  // drop, page reloaded mid-push): no status, the headers were never sent.
  // `app.inject()` cannot hang up, so the line is built in pino-http's shape
  // around a real request line.
  function abortedPush(from: LogLine): LogLine {
    return {
      ...from,
      req: { ...from.req, id: 'req-aborted' },
      res: { statusCode: null, headers: {} },
      msg: 'request aborted',
    }
  }

  describe('tail', () => {
    it('shows a refused push as its request line, status included', async () => {
      const refused = await refusedPush()
      expect(refused.status).toBe(409)

      const out = traces(['tail', '--no-follow'], refused.lines)

      expect(out).toMatch(/P4\s+device-under-test\s+POST \/api\/push\s+409/)
      expect(out).toContain('EPOCH_MISMATCH')
    })

    it('shows a push the server failed on with its 500', async () => {
      const failed = await failedPush()
      expect(failed.status).toBe(500)

      const out = traces(['tail', '--no-follow'], failed.lines)

      expect(out).toMatch(/P4\s+device-under-test\s+POST \/api\/push\s+500/)
    })

    it('shows a push the PC hung up on', async () => {
      const accepted = await push(pushBody())
      const out = traces(['tail', '--no-follow'], [
        abortedPush(accepted.lines.at(-1)!),
      ])

      expect(out).toMatch(/POST \/api\/push\s+abandonnée/)
    })
  })

  describe('postes', () => {
    // Refusées: final, the PC parks the write. Erreurs: the PC retries.
    it('counts a refused push as refused and a failed or abandoned one as an error', async () => {
      const refused = await refusedPush()
      const failed = await failedPush()
      const accepted = await push(pushBody())

      const out = traces(['postes', '--json'], [
        ...refused.lines,
        ...failed.lines,
        abortedPush(accepted.lines.at(-1)!),
      ])

      const [poste] = JSON.parse(out)
      expect(poste).toMatchObject({
        device: CLIENT.deviceId,
        requests: 3,
        refused: 1,
        failed: 2,
      })
    })
  })

  describe('stats', () => {
    it('counts every status of a route, abandoned requests included', async () => {
      const refused = await refusedPush()
      const failed = await failedPush()
      const accepted = await push(pushBody())

      const out = traces(['stats', '--json'], [
        ...refused.lines,
        ...failed.lines,
        ...accepted.lines,
        abortedPush(accepted.lines.at(-1)!),
      ])

      const [route] = JSON.parse(out)
      expect(route).toMatchObject({
        route: 'POST /api/push',
        count: 4,
        statuses: { 200: 1, 409: 1, 500: 1, abandon: 1 },
      })
    })
  })
})
