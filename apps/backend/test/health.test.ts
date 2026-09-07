import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from './support/test-app'

describe('GET /api/health', () => {
  let t: TestApp

  beforeAll(async () => {
    t = await createTestApp()
  })
  afterAll(() => t.app.close())

  it('reports liveness, memory and event-loop lag without authentication', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/health' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.memory.heapUsedMb).toBeGreaterThan(0)
    expect(body.eventLoopLagMs).toBeGreaterThanOrEqual(0)
  })

  it('answers 404 with the error contract for an unknown route', async () => {
    const res = await t.app.inject({ method: 'GET', url: '/api/nope' })

    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ code: 'NOT_FOUND' })
  })
})
