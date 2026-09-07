import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { truncateAll } from './support/database'
import {
  CLIENT,
  createTestApp,
  pushBody,
  type TestApp,
} from './support/test-app'

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

    const completed = t.logs.find(
      (line) => line.msg === 'request completed' && line.req?.url === '/api/push',
    )
    expect(completed?.req?.id).toBeDefined()
    const forThisRequest = t.logs.filter(
      (line) => line.req?.id === completed?.req?.id,
    )

    // The guard's refusal, the exception filter, then pino-http's own line.
    expect(forThisRequest.map((line) => line.msg)).toEqual([
      'Client synced against a previous database, refused',
      'La base de données du serveur a été réinitialisée depuis la dernière synchronisation de ce poste.',
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
