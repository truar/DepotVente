import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import bcrypt from 'bcrypt'
import { prisma, truncateAll } from './support/database'
import { createTestApp, type TestApp } from './support/test-app'

describe('authentication', () => {
  let t: TestApp
  const credentials = { email: 'admin@bourse.test', password: 'hunter2' }
  let userId: string

  beforeAll(async () => {
    t = await createTestApp()
  })
  afterAll(() => t.app.close())
  beforeEach(async () => {
    await truncateAll()
    const user = await prisma.user.create({
      data: {
        email: credentials.email,
        password: await bcrypt.hash(credentials.password, 4),
        role: 'ADMIN',
      },
    })
    userId = user.id
  })

  const signin = (payload: unknown) =>
    t.app.inject({ method: 'POST', url: '/api/signin', payload })

  describe('POST /api/signin', () => {
    it('returns a token that identifies the user on protected routes', async () => {
      const res = await signin(credentials)

      expect(res.statusCode).toBe(200)
      const { token } = res.json()
      expect(typeof token).toBe('string')

      const me = await t.app.inject({
        method: 'GET',
        url: '/api/protected',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(me.statusCode).toBe(200)
      expect(me.json()).toMatchObject({ payload: { id: userId, role: 'ADMIN' } })
    })

    it('refuses a wrong password', async () => {
      const res = await signin({ ...credentials, password: 'nope' })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toMatchObject({ code: 'UNAUTHORIZED' })
    })

    it('refuses an unknown email', async () => {
      const res = await signin({ ...credentials, email: 'nobody@bourse.test' })

      expect(res.statusCode).toBe(401)
    })

    it('rejects a body without credentials', async () => {
      const res = await signin({ email: credentials.email })

      expect(res.statusCode).toBe(400)
      expect(res.json()).toMatchObject({ code: 'INVALID_PAYLOAD' })
      expect(res.json().message).toContain('password')
    })
  })

  describe('protected routes', () => {
    it.each([
      ['no header', {}],
      ['a malformed header', { authorization: 'Token abc' }],
      ['a token signed with another secret', { authorization: `Bearer ${forgedToken()}` }],
    ])('refuse %s', async (_label, headers) => {
      const res = await t.app.inject({
        method: 'GET',
        url: '/api/protected',
        headers,
      })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toMatchObject({ code: 'UNAUTHORIZED' })
    })

    it('POST /api/logout answers the authenticated user', async () => {
      const res = await t.app.inject({
        method: 'POST',
        url: '/api/logout',
        headers: t.headers(),
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ message: 'Logged out successfully' })
    })
  })
})

// A syntactically valid JWT (header.payload.signature) the app never signed.
function forgedToken() {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ payload: { id: 'x', role: 'ADMIN' } })}.forged`
}
