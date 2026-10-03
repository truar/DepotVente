import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loginPage,
  reopenBrowser,
  signedOut,
  storedSession,
} from '@/test/pages/login.page.ts'
import { mainMenu, mainMenuPage } from '@/test/pages/main-menu.page.ts'
import { server } from '@/test/server.ts'
import { openScreen, screen, waitFor } from '@/test/screen.tsx'

// What the server received, in order: method, path, the Authorization header
// and the body.
type Received = {
  method: string
  path: string
  authorization: string | null
  body: unknown
}

// The backend's auth contract (apps/backend/src/auth): /api/signin answers a
// token for the right credentials, /api/protected answers the claims signed
// in it ({ payload: { id, role }, iat }) to whoever presents it.
function serverWithAccount(account: {
  email: string
  password: string
  role: 'ADMIN' | 'BENEVOLE'
  token: string
}): Array<Received> {
  const received: Array<Received> = []
  const record = async (request: Request) => {
    const url = new URL(request.url)
    received.push({
      method: request.method,
      path: url.pathname,
      authorization: request.headers.get('Authorization'),
      body: request.method === 'GET' ? null : await request.clone().json(),
    })
  }
  server.use(
    http.post('/api/signin', async ({ request }) => {
      await record(request)
      const { email, password } = (await request.json()) as {
        email: string
        password: string
      }
      if (email !== account.email || password !== account.password) {
        return HttpResponse.json(
          {
            message: 'Invalid credentials',
            error: 'Unauthorized',
            statusCode: 401,
          },
          { status: 401 },
        )
      }
      return HttpResponse.json({ token: account.token })
    }),
    http.get('/api/protected', async ({ request }) => {
      await record(request)
      if (request.headers.get('Authorization') !== `Bearer ${account.token}`) {
        return HttpResponse.json(
          { message: 'Authorization token is invalid', statusCode: 401 },
          { status: 401 },
        )
      }
      return HttpResponse.json({
        payload: { id: 'user-paul', role: account.role },
        iat: 1_700_000_000,
      })
    }),
  )
  return received
}

const paul = {
  email: 'paul@cmr.fr',
  password: 'neige2026',
  role: 'BENEVOLE' as const,
  token: 'jwt-signed-for-paul',
}

describe('Screen: signing in', () => {
  beforeEach(() => {
    signedOut()
  })

  // The volunteer types the right email and password: the
  // server is asked for a token, then, with that token, who it belongs to;
  // the volunteer lands on the main menu.
  it('lands on the main menu once the server knows the credentials, after asking who the token belongs to', async () => {
    const received = serverWithAccount(paul)
    const page = await loginPage()

    await page.signIn({ email: paul.email, password: paul.password })

    const menu = await mainMenu(page.user, page.pathname)
    expect(menu.pathname()).toBe('/')
    expect(received).toEqual([
      {
        method: 'POST',
        path: '/api/signin',
        authorization: null,
        body: { email: 'paul@cmr.fr', password: 'neige2026' },
      },
      {
        method: 'GET',
        path: '/api/protected',
        authorization: 'Bearer jwt-signed-for-paul',
        body: null,
      },
    ])
    expect(storedSession()).toEqual({
      token: 'jwt-signed-for-paul',
      isAuthenticated: true,
      user: { id: 'user-paul', role: 'BENEVOLE' },
    })
  })

  // The role comes from /api/protected: an administrator gets the
  // « Configuration » link and the « Bilan » card, a volunteer does not.
  it('reads the role from the server: an administrator gets the settings and the reports', async () => {
    serverWithAccount({ ...paul, role: 'ADMIN' })
    const page = await loginPage()

    await page.signIn({ email: paul.email, password: paul.password })

    const menu = await mainMenu(page.user, page.pathname)
    expect(menu.hasSettingsLink()).toBe(true)
    expect(menu.hasReportsCard()).toBe(true)
  })

  it('gives a volunteer neither the settings nor the reports', async () => {
    serverWithAccount(paul)
    const page = await loginPage()

    await page.signIn({ email: paul.email, password: paul.password })

    const menu = await mainMenu(page.user, page.pathname)
    expect(menu.hasSettingsLink()).toBe(false)
    expect(menu.hasReportsCard()).toBe(false)
  })

  // A wrong password: the volunteer stays on the login screen, told so, and
  // nothing is kept.
  it('keeps the volunteer on the login screen with a wrong password', async () => {
    const received = serverWithAccount(paul)
    const page = await loginPage()

    await page.signIn({ email: paul.email, password: 'wrong' })

    // Current behaviour, pinned until it is decided: the server's English
    // message is shown as it came, « Invalid credentials ».
    expect(await screen.findByText('Invalid credentials')).toBeVisible()
    expect(page.pathname()).toBe('/login')
    expect(received.map(({ path }) => path)).toEqual(['/api/signin'])
    expect(storedSession()).toEqual({
      token: null,
      isAuthenticated: false,
      user: null,
    })
  })

  // The server cannot be reached (cable unplugged, server down).
  it('keeps the volunteer on the login screen when the server cannot be reached', async () => {
    server.use(http.post('/api/signin', () => HttpResponse.error()))
    const page = await loginPage()

    await page.signIn({ email: paul.email, password: paul.password })

    // Current behaviour, pinned until it is decided: the runtime's own
    // English message is shown as it came. Here (Node's fetch) it reads
    // « fetch failed »; Chrome and Edge say « Failed to fetch », Firefox
    // « NetworkError when attempting to fetch resource. ».
    expect(await screen.findByText('fetch failed')).toBeVisible()
    expect(page.pathname()).toBe('/login')
  })
})

describe('Screen: the session kept on this computer', () => {
  beforeEach(() => {
    signedOut()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // The browser is closed at the end of the day and opened
  // again the next morning: the session was kept on disk (« auth-storage »),
  // the app opens straight on the main menu, without asking the server.
  it('opens straight on the main menu after the browser is closed and reopened', async () => {
    serverWithAccount(paul)
    const page = await loginPage()
    await page.signIn({ email: paul.email, password: paul.password })
    await mainMenu(page.user, page.pathname)

    await reopenBrowser()
    // Any request now would fail the test: the server has nothing to answer.
    server.resetHandlers()

    const menu = await mainMenuPage()
    expect(menu.pathname()).toBe('/')
    expect(storedSession()?.token).toBe('jwt-signed-for-paul')
  })

  // The session never expires: a year later, the app still opens on the
  // menu, without asking the server whether the token is still good.
  it('still opens on the main menu a year later, without checking the token', async () => {
    serverWithAccount(paul)
    const page = await loginPage()
    await page.signIn({ email: paul.email, password: paul.password })
    await mainMenu(page.user, page.pathname)

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(Date.now() + 366 * 24 * 3600 * 1000))
    await reopenBrowser()
    server.resetHandlers()

    // Current behaviour, pinned until it is decided: the token is never
    // checked again (the server signs it without expiry, and the app only
    // looks at the « isAuthenticated » flag it stored).
    const menu = await mainMenuPage()
    expect(menu.pathname()).toBe('/')
  })

  // Without a stored session, every screen sends to the login screen.
  it('sends to the login screen when nobody is signed in on this computer', async () => {
    const { router } = await openScreen('/')

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(
      await screen.findByRole('button', { name: 'Se connecter' }),
    ).toBeVisible()
  })
})
