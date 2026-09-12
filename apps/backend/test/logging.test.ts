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

  // The only trace of what a cash register sent: a refused push is logged by
  // the exception filter with its code, an accepted one has to say so itself.
  it('says what an accepted push carried, and from which cash register', async () => {
    const body = pushBody()
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/push',
      headers: t.headers(),
      payload: body,
    })
    expect(res.statusCode).toBe(200)

    const applied = t.logs.filter(
      (line) => line.msg === 'Push applied' && line.recordId === body.recordId,
    )
    expect(applied).toHaveLength(1)
    expect(applied[0]).toMatchObject({
      collection: 'contacts',
      operation: 'create',
      recordId: body.recordId,
      operationId: body.operationId,
      outcome: 'applied',
      device: CLIENT.deviceId,
      workstation: CLIENT.workstation,
      appVersion: CLIENT.appVersion,
    })
  })

  // A push the client retried because it never saw the first 200: the record
  // is already there, and the line says so instead of claiming a new write.
  it('marks a create the server had already applied as a duplicate', async () => {
    const body = pushBody()
    const push = () =>
      t.app.inject({
        method: 'POST',
        url: '/api/push',
        headers: t.headers(),
        payload: body,
      })

    expect((await push()).statusCode).toBe(200)
    expect((await push()).statusCode).toBe(200)

    expect(
      t.logs
        .filter(
          (line) =>
            line.msg === 'Push applied' && line.recordId === body.recordId,
        )
        .map((line) => line.outcome),
    ).toEqual(['applied', 'duplicate'])
  })

  it('tags every line written for a request with the client identity', async () => {
    const res = await t.app.inject({
      method: 'POST',
      url: '/api/push',
      headers: t.headers({ 'x-dataset-epoch': randomUUID() }),
      payload: pushBody(),
    })
    expect(res.statusCode).toBe(409)

    // findLast: the stories above have pushed too, and it is this request's
    // lines that are being checked.
    const completed = t.logs.findLast(
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
