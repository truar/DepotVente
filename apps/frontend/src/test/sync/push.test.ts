import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FakeServer } from '@/test/sync/computer.ts'
import { db } from '@/db.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { aDepositForm, app, givenWorkstation } from '@/test/harness.ts'
import {
  bootComputer,
  fakeClock,
  givenServer,
  nextSyncTimer,
  realClock,
  settle,
  shutDownComputers,
} from '@/test/sync/computer.ts'
import { settingsPage } from '@/test/pages/settings.page.ts'
import { openScreen, screen, signedInAs, waitFor } from '@/test/screen.tsx'

// What one deposit registered at the desk queues for the server: its seller,
// the deposit, its article, in that order.
async function registerADeposit(depotIndex = 12) {
  await app.createDeposit(aDepositForm({ depotIndex }))
}

const serverError = {
  status: 500,
  code: 'INTERNAL_ERROR',
  message: 'Erreur interne du serveur.',
}

// With the clock faked: moves it from one timer to the next until the
// server has received `count` push attempts in all.
async function untilPushAttempts(backend: FakeServer, count: number) {
  for (let rounds = 0; rounds < 500; rounds++) {
    await settle()
    if (backend.pushes().length >= count) return
    nextSyncTimer()
  }
  throw new Error(
    `${backend.pushes().length} push attempts reached the server, not ${count}`,
  )
}

// Milliseconds between consecutive push attempts, as the server saw them.
function delaysBetweenPushes(backend: FakeServer) {
  const times = backend.requestsTo('/api/push').map((request) => request.at)
  return times.slice(1).map((time, index) => time - times[index])
}

function signedOut() {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
}

// Played against the sync loop of this computer (the worker's, driven
// through the same service) and a stand-in server: what the server
// receives, and what Paramètres shows the administrator.
describe('Sync: pushing local writes to the server', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
  })
  afterEach(() => {
    shutDownComputers()
    realClock()
  })

  // SYNC-03 — The network is fine: a deposit registered at the desk leaves
  // for the server at once, seller first, and nothing is left waiting.
  it('pushes a write right away, in write order, and empties the queue once accepted', async () => {
    const backend = givenServer()
    await bootComputer()

    await registerADeposit()

    await waitFor(() => expect(backend.pushes()).toHaveLength(3))
    expect(
      backend
        .pushedRecords()
        .map(([collection, operation]) => [collection, operation]),
    ).toEqual([
      ['contacts', 'create'],
      ['deposits', 'create'],
      ['articles', 'create'],
    ])
    expect(backend.pushes()[0]).toMatchObject({
      collection: 'contacts',
      data: { lastName: 'Durand', firstName: 'Camille' },
    })
    const page = await settingsPage()
    expect(page.waitingCount()).toBe(0)
    expect(page.noRefusedOperation()).toBe(true)
  })

  // SYNC-04 — The server cannot be reached, then answers 500, then 503:
  // the seller is sent again and again, a little later each time, and the
  // deposit and its article wait behind it. Fake clock: the delays are
  // seconds to minutes.
  it('retries a transient failure with a growing delay, the operations behind it waiting', async () => {
    const backend = givenServer()
    const failures: Array<'network-error' | typeof serverError> = [
      'network-error',
      serverError,
      { ...serverError, status: 503 },
    ]
    backend.answerPushes(() => failures.shift() ?? 'accepted')
    await registerADeposit()
    fakeClock()

    await bootComputer()
    await untilPushAttempts(backend, 6)

    // The first retry comes after 2 s, not 1 s: the delay is computed from
    // the attempt count already incremented (1 s × 2^failures). Kept as is,
    // decided on 2026-10-03.
    expect(delaysBetweenPushes(backend)).toEqual([2000, 4000, 8000, 0, 0])
    expect(backend.pushedRecords().map(([collection]) => collection)).toEqual([
      'contacts',
      'contacts',
      'contacts',
      'contacts',
      'deposits',
      'articles',
    ])
  })

  // SYNC-05 — The server keeps failing on the seller: after ten attempts
  // it gives up on it and the administrator finds it among the refused
  // operations, with the last error. The queue then goes on.
  it('parks an operation as MAX_RETRIES after ten transient failures, visible in Paramètres', async () => {
    const backend = givenServer()
    backend.answerPushes((push) =>
      push.collection === 'contacts' ? serverError : 'accepted',
    )
    await registerADeposit()
    fakeClock()

    await bootComputer()
    await untilPushAttempts(backend, 12)

    const delays = delaysBetweenPushes(backend)
    // Ten attempts on the seller, the delay doubling from 2 s to 512 s;
    // then, 17 min (the cap) after the tenth, it is parked without an
    // eleventh attempt, and the deposit and the article leave.
    expect(delays).toEqual([
      2000,
      4000,
      8000,
      16_000,
      32_000,
      64_000,
      128_000,
      256_000,
      512_000,
      17 * 60_000,
      0,
    ])
    expect(backend.pushedRecords().map(([collection]) => collection)).toEqual([
      ...Array(10).fill('contacts'),
      'deposits',
      'articles',
    ])
    realClock()
    const page = await settingsPage()
    await waitFor(() => expect(page.refusedOperations()).toHaveLength(1))
    expect(page.waitingCount()).toBe(0)
    expect(page.refusedOperations()).toEqual([
      {
        what: `create · contacts · ${backend.pushes()[0].recordId}`,
        attempts: 'tentatives : 10 · MAX_RETRIES',
        error:
          'Abandon après 10 tentatives: HTTP 500: Erreur interne du serveur.',
      },
    ])
  }, 30_000)

  // SYNC-06 — The server refuses some writes for good (invalid data,
  // duplicate, unknown record): each is parked as refused, shown in
  // Paramètres with its code and status, and the queue carries on.
  it('parks each 4xx as refused and goes on with the next operation', async () => {
    const backend = givenServer()
    const refusals: Record<
      string,
      { status: number; code: string; message: string }
    > = {
      contacts: {
        status: 400,
        code: 'INVALID_DATA',
        message: 'Données refusées par le schéma: city',
      },
      deposits: {
        status: 409,
        code: 'DUPLICATE',
        message: 'Enregistrement déjà existant.',
      },
      articles: {
        status: 404,
        code: 'RECORD_NOT_FOUND',
        message: 'Enregistrement inconnu du serveur.',
      },
    }
    let firstDeposit = true
    backend.answerPushes((push) => {
      if (!firstDeposit) return 'accepted'
      if (push.collection === 'articles') firstDeposit = false
      return refusals[push.collection]
    })
    await bootComputer()

    await registerADeposit(12)
    await registerADeposit(13)

    await waitFor(() => expect(backend.pushes()).toHaveLength(6))
    await settle(5)
    const recordIds = backend.pushes().map((push) => push.recordId)
    const page = await settingsPage()
    expect(page.waitingCount()).toBe(0)
    // Current behaviour, pinned until it is decided: the list is sorted by
    // timestamp only, so operations written in the same transaction (same
    // millisecond) come in no particular order, not in write order.
    await waitFor(() => expect(page.refusedOperations()).toHaveLength(3))
    expect(page.refusedOperations()).toEqual(
      expect.arrayContaining([
        {
          what: `create · contacts · ${recordIds[0]}`,
          attempts: 'tentatives : 0 · INVALID_DATA (HTTP 400)',
          error: 'Données refusées par le schéma: city',
        },
        {
          what: `create · deposits · ${recordIds[1]}`,
          attempts: 'tentatives : 0 · DUPLICATE (HTTP 409)',
          error: 'Enregistrement déjà existant.',
        },
        {
          what: `create · articles · ${recordIds[2]}`,
          attempts: 'tentatives : 0 · RECORD_NOT_FOUND (HTTP 404)',
          error: 'Enregistrement inconnu du serveur.',
        },
      ]),
    )
    // Each pushed once: a refusal is not retried.
    expect(new Set(recordIds).size).toBe(6)
  })

  // SYNC-08 — The session token is no longer valid (401): the seller is
  // not refused, it waits for a login without using up its attempts; once
  // logged in again, everything leaves.
  it('keeps a 401 waiting without counting attempts, and sends it after the next login', async () => {
    const backend = givenServer()
    await registerADeposit()
    fakeClock()
    backend.revokesTokens()

    await bootComputer()
    await untilPushAttempts(backend, 12)

    // Retried within 30 s, the seller only: the queue stays in order.
    // Kept as is, decided on 2026-10-03: the cadence is not a steady 30 s. The outbox watcher re-runs the queue whenever the
    // operation turns « failed », and an operation with no counted attempt
    // only waits the 1 s backoff: depending on which runs first, attempts
    // come 1 s or 30 s apart (sequences seen: 30-30-30-1-1-29-1-30 s…,
    // 30-30-1-59-30 s…).
    const delays = delaysBetweenPushes(backend)
    expect(delays[0]).toBeLessThanOrEqual(30_000)
    expect(
      backend
        .pushedRecords()
        .every(([collection]) => collection === 'contacts'),
    ).toBe(true)
    // Kept as is, decided on 2026-10-03: no attempt is ever counted, so
    // after 12 refusals it is still not parked: it stays waiting, and keeps
    // knocking, until someone logs in.
    const seller = await db.outbox
      .where('collection')
      .equals('contacts')
      .first()
    expect(seller).toMatchObject({
      status: 'failed',
      retryCount: 0,
      error: 'Non authentifié',
      httpStatus: 401,
    })

    const beforeLogin = backend.pushes().length
    await useAuthStore.getState().login('admin@test', 'secret')
    await untilPushAttempts(backend, beforeLogin + 3)

    const afterLogin = backend.requestsTo('/api/push').slice(beforeLogin)
    expect(
      afterLogin.map(
        (request) => (request.body as { collection: string }).collection,
      ),
    ).toEqual(['contacts', 'deposits', 'articles'])
    expect(
      afterLogin.every(
        (request) => request.headers.authorization === 'Bearer fresh-token',
      ),
    ).toBe(true)
    realClock()
    const page = await settingsPage()
    expect(page.waitingCount()).toBe(0)
    expect(page.noRefusedOperation()).toBe(true)
  })

  // SYNC-09 — Nobody is logged in on this computer: the writes queued
  // earlier stay here; they leave when a volunteer logs in.
  it('sends nothing while logged out, and the waiting writes at the next login', async () => {
    const backend = givenServer()
    await registerADeposit()
    signedOut()

    const computer = await bootComputer()
    // A poll (the worker's 20 s tick) finds nobody logged in: it does
    // nothing, and does not fail.
    await expect(computer.poll()).resolves.toBeUndefined()
    await settle(5)

    // Logged out, the computer does not talk to the server at all: no full
    // load, no delta, no push.
    expect(backend.received).toEqual([])

    const { user } = await openScreen('/login')
    await user.type(screen.getByLabelText('Email'), 'admin@test')
    await user.type(screen.getByLabelText('Mot de passe'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => expect(backend.pushes()).toHaveLength(3))
    expect(backend.pushedRecords().map(([collection]) => collection)).toEqual([
      'contacts',
      'deposits',
      'articles',
    ])
    expect(
      backend
        .requestsTo('/api/push')
        .every(
          (request) => request.headers.authorization === 'Bearer fresh-token',
        ),
    ).toBe(true)
    // The login also starts the full load this computer never had.
    await waitFor(() =>
      expect(
        backend
          .requestsTo('/api/sync/initial')
          .map((request) => request.headers.authorization),
      ).toEqual(['Bearer fresh-token']),
    )
    const page = await settingsPage()
    await waitFor(() => expect(page.datasetEpoch()).toBe('epoch-2026'))
    expect(page.lastSync()).not.toBe('Non synchonisé')
    expect(page.waitingCount()).toBe(0)
  })

  // SYNC-22 — The server is unreachable when the volunteer closes the
  // browser. The writes are still on this computer the next morning, and
  // leave as soon as the application is opened again.
  it('keeps unsent writes across a browser restart and sends them once reopened', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-14T17:00:00') })
    const backend = givenServer()
    await bootComputer()
    backend.goesOffline()
    await registerADeposit()
    await waitFor(() => expect(backend.pushes()).toHaveLength(1))
    const evening = await settingsPage()
    await waitFor(() => expect(evening.waitingCount()).toBe(3))

    shutDownComputers()
    vi.setSystemTime(new Date('2026-11-15T08:00:00'))
    backend.comesBackOnline()
    await bootComputer()

    await waitFor(() => expect(backend.pushes()).toHaveLength(4))
    expect(backend.pushedRecords().map(([collection]) => collection)).toEqual([
      'contacts',
      'contacts',
      'deposits',
      'articles',
    ])
    const morning = await settingsPage()
    expect(morning.waitingCount()).toBe(0)
  })
})
