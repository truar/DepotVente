import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
import { screen, signedInAs, waitFor } from '@/test/screen.tsx'

// Played on the real Paramètres screen, against this computer's sync loop
// (the worker's, driven through the same service) and a stand-in server.
describe('Screen: Paramètres', () => {
  beforeEach(() => {
    signedInAs('ADMIN')
  })
  afterEach(() => {
    shutDownComputers()
    realClock()
  })

  // PAR-08 — The network drops during the sale: the administrator sees the
  // operations piling up in « Opérations en attente d'envoi », and the
  // count falls back to 0 once the network is back and the queue retried.
  // The clock is faked for the sync's retry delays only.
  it('counts the operations waiting while offline, back to 0 when the network returns', async () => {
    await givenWorkstation(1000)
    const backend = givenServer()
    fakeClock()
    await bootComputer()
    const page = await settingsPage()
    expect(page.waitingCount()).toBe(0)
    backend.goesOffline()

    await app.createDeposit(aDepositForm({ depotIndex: 12 }))
    await waitFor(() => expect(page.waitingCount()).toBe(3))
    await app.createDeposit(aDepositForm({ depotIndex: 13 }))
    await waitFor(() => expect(page.waitingCount()).toBe(6))

    backend.comesBackOnline()
    for (let i = 0; i < 20 && page.waitingCount() > 0; i++) {
      nextSyncTimer()
      await settle()
    }
    await waitFor(() => expect(page.waitingCount()).toBe(0))
    expect(page.noRefusedOperation()).toBe(true)
    expect(
      backend
        .pushedRecords()
        .slice(-6)
        .map(([collection]) => collection),
    ).toEqual([
      'contacts',
      'deposits',
      'articles',
      'contacts',
      'deposits',
      'articles',
    ])
  })

  // PAR-13 — A new computer has no register number: the main menu asks for
  // one. The administrator types it in Paramètres and validates; the badge
  // and the main menu follow, and the server sees the number from then on.
  it('saves the register number on this computer and shows it in the badge and the main menu', async () => {
    const backend = givenServer()
    const computer = await bootComputer()
    const page = await settingsPage()
    expect(page.workstationBadge()).toBeNull()
    expect(page.currentWorkstation()).toBe(0)

    await page.typeWorkstation('')
    expect(page.validateButton()).toBeDisabled()
    await page.typeWorkstation('2000')
    expect(page.validateButton()).toBeEnabled()
    await page.validateWorkstation()

    await waitFor(() => expect(page.currentWorkstation()).toBe(2000))
    expect(page.workstationBadge()).toBe('Caisse 2000')
    await page.backToMainMenu()
    expect(await screen.findByText('Caisse 2000')).toBeInTheDocument()
    expect(screen.queryByText('Configuration requise')).toBeNull()
    await computer.poll()
    expect(backend.received.at(-1)?.headers.workstation).toBe('2000')
  })

  // An administrator re-sends an operation the server had refused, after
  // fixing the cause on the server: it leaves the refused list, the server
  // receives it again, and nothing is left waiting.
  it('re-sends a refused operation with « Réessayer »', async () => {
    await givenWorkstation(1000)
    const backend = givenServer()
    let refuseSeller = true
    backend.answerPushes((push) => {
      if (push.collection === 'contacts' && refuseSeller) {
        return {
          status: 400,
          code: 'INVALID_DATA',
          message: 'Données refusées par le schéma: city',
        }
      }
      return 'accepted'
    })
    await bootComputer()
    await app.createDeposit(aDepositForm())
    await waitFor(() => expect(backend.pushes()).toHaveLength(3))
    const page = await settingsPage()
    await waitFor(() => expect(page.refusedOperations()).toHaveLength(1))
    refuseSeller = false

    await page.retryRefused(0)

    await waitFor(() => expect(backend.pushes()).toHaveLength(4))
    await waitFor(() => expect(page.noRefusedOperation()).toBe(true))
    expect(page.waitingCount()).toBe(0)
    expect(backend.pushedRecords()[3][0]).toBe('contacts')
    // Current behaviour, pinned until it is decided: « Réessayer » runs the
    // queue on the page's own copy of the sync service, which never gets
    // the login token (only the worker does) and stops there. The operation
    // only leaves because the worker sees it turn « pending » and pushes it
    // itself: every push carries the worker's token, none comes without.
    expect(
      backend
        .requestsTo('/api/push')
        .every(
          (request) => request.headers.authorization === 'Bearer test-token',
        ),
    ).toBe(true)
  })
})
