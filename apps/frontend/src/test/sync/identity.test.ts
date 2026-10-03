import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db.ts'
import { aDepositForm, app, givenWorkstation } from '@/test/harness.ts'
import {
  bootComputer,
  givenServer,
  settle,
  shutDownComputers,
} from '@/test/sync/computer.ts'
import { settingsPage } from '@/test/pages/settings.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'
import { server as network } from '@/test/server.ts'

const serverError = {
  code: 'INTERNAL_ERROR',
  message: 'Erreur interne du serveur.',
}

// SYNC-13 — Who the computer is and which server database it synced
// against travel with every request: the server log and its epoch check
// depend on them. Played against the sync loop of this computer and a
// stand-in server; what the server receives is checked against what
// Paramètres shows.
describe('Sync: identity and dataset epoch on every request', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
  })
  afterEach(() => shutDownComputers())

  // A brand-new computer: no epoch until the server gave one. From then on
  // every push and delta names it, and every request says which computer,
  // which register and which build it comes from — as Paramètres shows.
  //
  // First in the file on purpose: the device id is kept in memory once
  // created, and only the first test of a file starts from a browser that
  // never had one.
  it('sends the device, workstation and build on every request, and the epoch once adopted', async () => {
    const backend = givenServer({ epoch: 'epoch-2026' })
    const computer = await bootComputer({ firstLaunch: true })
    await app.createDeposit(aDepositForm())
    await waitFor(() => expect(backend.pushes()).toHaveLength(3))
    await computer.poll()

    const page = await settingsPage()
    const sync = backend.received
    expect(sync.map((request) => request.path.split('?')[0])).toEqual([
      '/api/sync/initial',
      '/api/sync/ping',
      '/api/sync/delta',
      '/api/push',
      '/api/push',
      '/api/push',
      '/api/sync/delta',
    ])
    expect(
      sync.every((request) => request.headers.workstation === '1000'),
    ).toBe(true)
    expect(
      sync.every((request) => request.headers.appVersion === page.appVersion()),
    ).toBe(true)
    expect(page.datasetEpoch()).toBe('epoch-2026')
    expect(sync.map((request) => request.headers.datasetEpoch)).toEqual([
      null,
      null,
      'epoch-2026',
      'epoch-2026',
      'epoch-2026',
      'epoch-2026',
      'epoch-2026',
    ])
    // Every request, the very first included, carries the one device id
    // Paramètres shows.
    const deviceIds = sync.map((request) => request.headers.deviceId)
    expect(deviceIds.every((id) => id === page.deviceId())).toBe(true)
  })

  // A computer synced by an older build (cursor, no epoch): it asks the
  // server for the epoch before anything else, then names it.
  it('adopts the server epoch through /sync/ping when it has none', async () => {
    const backend = givenServer({ epoch: 'epoch-2026' })
    // What an older build left on this computer: a sync cursor only.
    await db.syncMetadata.put({ key: 'lastSync', value: Date.now() - 60_000 })

    await bootComputer()
    await app.createDeposit(aDepositForm())
    await waitFor(() => expect(backend.pushes()).toHaveLength(3))

    // Its first request asks for the epoch; every delta and push after
    // names it. (The first poll and the queue kicked by the login token may
    // both ask: one or two pings, depending on which gets there first.)
    expect(backend.received[0]).toMatchObject({
      path: '/api/sync/ping',
      headers: { datasetEpoch: null },
    })
    expect(
      backend
        .requestsTo('/api/sync/delta')
        .map((request) => request.headers.datasetEpoch),
    ).toEqual(['epoch-2026'])
    expect(
      backend
        .requestsTo('/api/push')
        .every((request) => request.headers.datasetEpoch === 'epoch-2026'),
    ).toBe(true)
    const page = await settingsPage()
    expect(page.datasetEpoch()).toBe('epoch-2026')
  })

  // Same computer, but the server cannot tell its epoch: rather than push
  // without one (the server would refuse it, 400 EPOCH_REQUIRED), it keeps
  // the writes and pushes nothing.
  it('pushes nothing while it cannot learn the epoch', async () => {
    const backend = givenServer()
    network.use(
      http.get('/api/sync/ping', () =>
        HttpResponse.json(serverError, { status: 500 }),
      ),
    )
    await db.syncMetadata.put({ key: 'lastSync', value: Date.now() - 60_000 })

    const computer = await bootComputer()
    await app.createDeposit(aDepositForm())
    await computer.poll()
    await settle(5)

    expect(backend.pushes()).toEqual([])
    expect(backend.requestsTo('/api/sync/delta')).toEqual([])
    const page = await settingsPage()
    await waitFor(() => expect(page.waitingCount()).toBe(3))
    expect(page.datasetEpoch()).toBe('—')
  })
})
