import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { givenWorkstation } from '@/test/harness.ts'
import { depositsListingPage } from '@/test/pages/deposits-listing.page.ts'
import {
  aServerDeposit,
  bootComputer,
  givenServer,
  settle,
  shutDownComputers,
} from '@/test/sync/computer.ts'
import { settingsPage } from '@/test/pages/settings.page.ts'
import { screen, signedInAs } from '@/test/screen.tsx'

const MORNING = new Date('2026-11-14T08:00:00')
const LATER = new Date('2026-11-14T08:00:20')

// Played against the sync loop of this computer (the worker's, driven
// through the same service) and a stand-in server: what reaches the
// screens of this computer from the others.
describe('Sync: pulling what the other computers wrote', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
    // Date only: the sync cursor is a server timestamp the story wants to
    // read back.
    vi.useFakeTimers({ toFake: ['Date'], now: MORNING })
  })
  afterEach(() => {
    shutDownComputers()
    vi.useRealTimers()
  })

  // SYNC-11 — The very first launch on this computer: it loads the whole
  // server base, then only asks for what changed since.
  it('loads the full base on a first launch, then switches to deltas', async () => {
    const backend = givenServer({ dataset: aServerDeposit(21, 'Bernard') })

    const computer = await bootComputer()
    vi.setSystemTime(LATER)
    await computer.poll()
    await computer.poll()

    // (The queue, kicked by the login token, also asks /sync/ping for the
    // epoch meanwhile: not part of the pull.)
    expect(
      backend.received
        .map((request) => request.path)
        .filter((path) => path !== '/api/sync/ping'),
    ).toEqual([
      '/api/sync/initial',
      `/api/sync/delta?since=${MORNING.getTime()}`,
      `/api/sync/delta?since=${MORNING.getTime()}`,
      `/api/sync/delta?since=${LATER.getTime()}`,
    ])
    const listing = await depositsListingPage()
    await listing.waitForDeposits(1)
    expect(listing.deposit(21)).toMatchObject({
      seller: 'Bernard Paul',
      articleCount: 1,
    })
    const settings = await settingsPage()
    expect(settings.lastSync()).toBe(
      `Dernière synchronisation = ${LATER.toLocaleString()}`,
    )
  })

  // SYNC-10 — A deposit registered on another computer reaches this one at
  // its next poll: it asks for what changed since its last sync, merges it,
  // and the deposit shows in the list.
  it('shows on this computer, after one poll, a deposit written on another one', async () => {
    const backend = givenServer({ dataset: aServerDeposit(20, 'Martin') })
    const computer = await bootComputer()
    const listing = await depositsListingPage()
    await listing.waitForDeposits(1)

    vi.setSystemTime(LATER)
    backend.publishes(aServerDeposit(21, 'Bernard'))
    await computer.poll()

    expect(backend.requestsTo('/api/sync/delta').at(-1)?.path).toBe(
      `/api/sync/delta?since=${MORNING.getTime()}`,
    )
    await listing.waitForDeposits(2)
    expect(listing.depositNumbers().sort()).toEqual([20, 21])
    expect(listing.deposit(21)).toMatchObject({
      seller: 'Bernard Paul',
      articleCount: 1,
    })
  })

  // A poll the server refuses (database down, 500): this computer keeps its
  // base as it was and tries again at the next poll.
  it('keeps the local base when a delta fails, and nothing tells the operator', async () => {
    const backend = givenServer({ dataset: aServerDeposit(20, 'Martin') })
    const computer = await bootComputer()
    backend.answerDeltasWith({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur.',
    })
    backend.publishes(aServerDeposit(21, 'Bernard'))

    vi.setSystemTime(LATER)
    await computer.poll()
    await settle(5)

    const listing = await depositsListingPage()
    await listing.waitForDeposits(1)
    // Current behaviour, pinned until it is decided: a failed delta is only
    // logged in the worker's console. Nothing on screen says this computer
    // stopped receiving the others' writes: no alert, and Paramètres still
    // shows the last successful synchronisation as if all were well.
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    const settings = await settingsPage()
    expect(settings.lastSync()).toBe(
      `Dernière synchronisation = ${MORNING.toLocaleString()}`,
    )
    expect(screen.queryByRole('alert')).toBeNull()

    // At the next poll the server answers again: what was missed arrives.
    backend.answerDeltasWith(null)
    await computer.poll()
    const after = await depositsListingPage()
    await after.waitForDeposits(2)
  })
})
