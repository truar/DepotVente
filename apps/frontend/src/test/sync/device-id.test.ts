import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { aDepositForm, app, givenWorkstation } from '@/test/harness.ts'
import {
  bootComputer,
  givenServer,
  shutDownComputers,
} from '@/test/sync/computer.ts'
import { settingsPage } from '@/test/pages/settings.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// SYNC-13 — The device id is created once per browser. On the very first
// launch several requests start at the same time (the full base asked by the
// start of the sync, the epoch asked by the queue kicked by the login token)
// and all of them must name the same computer: the one Paramètres shows.
describe('Sync: one device id per browser, from the first request', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
  })
  afterEach(() => shutDownComputers())

  // Only story of the file: the device id is kept in memory once created,
  // so only the first story of a file starts from a browser that never had
  // one.
  it('carries the same device id on every request of a first launch', async () => {
    const backend = givenServer({ epoch: 'epoch-2026' })
    await bootComputer({ firstLaunch: true })
    await app.createDeposit(aDepositForm())
    await waitFor(() => expect(backend.pushes()).toHaveLength(3))

    const page = await settingsPage()
    const deviceIds = backend.received.map(
      (request) => request.headers.deviceId,
    )
    expect(page.deviceId()).toMatch(/^[0-9a-f-]{36}$/)
    // Every request, the first included, names the computer Paramètres
    // shows.
    expect(deviceIds).toEqual(deviceIds.map(() => page.deviceId()))
    // The first launch asks the epoch only once, as before.
    expect(backend.requestsTo('/api/sync/ping')).toHaveLength(1)
  })
})
