import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { truncateAll } from './support/database'
import { CLIENT, createTestApp, pushBody, type TestApp } from './support/test-app'

describe('request logging', () => {
  let t: TestApp

  beforeAll(async () => {
    t = await createTestApp()
    await truncateAll()
  })
  afterAll(() => t.app.close())

  it('tags every line written for a request with the client identity', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/push',
      headers: t.headers({ 'x-dataset-epoch': randomUUID() }),
      payload: pushBody(),
    })
    expect(res.statusCode).toBe(409)

    const incoming = t.logs.find(
      (line) =>
        line.msg === 'incoming request' &&
        (line.req as { url?: string } | undefined)?.url === '/api/push',
    )
    expect(incoming?.reqId).toBeDefined()
    const forThisRequest = t.logs.filter(
      (line) => line.reqId === incoming?.reqId,
    )

    // Fastify's own lines around the epoch refusal written by our hook.
    expect(forThisRequest.map((line) => line.msg)).toEqual([
      'incoming request',
      'Client synced against a previous database, refused',
      'request completed',
    ])
    for (const line of forThisRequest) {
      expect(line).toMatchObject({
        device: CLIENT.deviceId,
        workstation: CLIENT.workstation,
        appVersion: CLIENT.appVersion,
      })
    }
  })
})
