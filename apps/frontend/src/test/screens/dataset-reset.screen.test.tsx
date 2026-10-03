import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FakeServer } from '@/test/sync/computer.ts'
import { db } from '@/db.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import {
  aDepositForm,
  app,
  givenDeposit,
  givenWorkstation,
  runHook,
} from '@/test/harness.ts'
import { datasetResetDialog } from '@/test/pages/dataset-reset.page.ts'
import { depositsListingPage } from '@/test/pages/deposits-listing.page.ts'
import {
  aServerDeposit,
  bootComputer,
  givenServer,
  settle,
  shutDownComputers,
} from '@/test/sync/computer.ts'
import { settingsPage } from '@/test/pages/settings.page.ts'
import { openScreen, screen, signedInAs, waitFor } from '@/test/screen.tsx'

const DETECTED = new Date('2026-11-14T09:30:00')

// Cheque printing offsets, as « Configurer l'impression des chèques » saves
// them on this computer. That screen embeds a PDF viewer jsdom cannot run,
// so they are given directly.
const chequeOffsets = { outerTranslateX: 3.5, outerTranslateY: -1 }

// This computer synced with the server on database « epoch-2026 »; one of
// its deposits (12) is on the server too.
async function aComputerInSync() {
  const backend = givenServer({
    epoch: 'epoch-2026',
    dataset: aServerDeposit(12, 'Durand'),
  })
  const computer = await bootComputer()
  return { backend, computer }
}

// Then the server database is rebuilt between two test sessions: new epoch,
// and a single deposit, 30.
function theServerIsReset(backend: FakeServer) {
  backend.resetsDatabase('epoch-2027', aServerDeposit(30, 'Bernard'))
}

// One write of this computer, as an article correction queues it.
async function correctAnArticle() {
  const { articles } = await givenDeposit({ depositIndex: 40 })
  const { update } = await runHook(useArticlesDb)
  await update(articles[0].id, { price: 95 })
}

// Played on the real screens, against this computer's sync loop (the
// worker's, driven through the same service) and a stand-in server: the
// server database was reset (new epoch) while this computer still held the
// old one.
describe('Screen: the server database was reset', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
    // Date only: the dialog prints when the reset was detected.
    vi.useFakeTimers({ toFake: ['Date'], now: DETECTED })
  })
  afterEach(() => {
    shutDownComputers()
    vi.useRealTimers()
  })

  // SYNC-14 — The next push is refused with EPOCH_MISMATCH: the computer
  // stops pushing and pulling until its base is rebuilt; the refused write
  // is kept, not parked as refused.
  it('suspends every push and poll once the server answers EPOCH_MISMATCH to a push', async () => {
    const { backend, computer } = await aComputerInSync()
    await openScreen('/')
    theServerIsReset(backend)
    const before = backend.received.length

    await app.createDeposit(aDepositForm({ depotIndex: 13 }))
    await datasetResetDialog.shown()
    await computer.poll()
    await app.createDeposit(aDepositForm({ depotIndex: 14 }))
    await settle()

    // One push, refused; then nothing: no delta, no other push.
    const after = backend.received.slice(before)
    expect(after.map((request) => request.path)).toEqual(['/api/push'])
    expect(after[0].headers.datasetEpoch).toBe('epoch-2026')
    // The refused write and those behind it are all still here (Paramètres
    // sits behind the dialog; the dialog counts them).
    expect(datasetResetDialog.lostOperationsWarning()).toBe(
      "6 opérations saisies sur ce poste n'ont pas pu être transmises et seront perdues.",
    )
    const refused = await db.outbox.where('status').equals('rejected').count()
    expect(refused).toBe(0)
  })

  // SYNC-14 — Same reset, found by a poll: the delta is refused with
  // EPOCH_MISMATCH and the computer suspends its sync the same way.
  it('suspends the sync once a delta is refused with EPOCH_MISMATCH', async () => {
    const { backend, computer } = await aComputerInSync()
    await openScreen('/')
    theServerIsReset(backend)

    await computer.poll()
    await datasetResetDialog.shown()
    const before = backend.received.length
    await computer.poll()
    await app.createDeposit(aDepositForm({ depotIndex: 13 }))
    await settle()

    expect(backend.received.slice(before)).toEqual([])
  })

  // SYNC-15 — The dialog stands in front of every screen, says when the
  // reset was detected, and cannot be dismissed: Escape leaves it there.
  it('shows the reset dialog on every page, with the detection date, and Escape does not close it', async () => {
    const { backend, computer } = await aComputerInSync()
    theServerIsReset(backend)
    await computer.poll()

    for (const path of ['/', '/settings', '/deposits/listing', '/sales']) {
      const { user } = await openScreen(path)
      await datasetResetDialog.shown()
      expect(datasetResetDialog.detectedOn()).toBe(
        DETECTED.toLocaleString('fr-FR'),
      )
      await user.keyboard('{Escape}')
      expect(datasetResetDialog.isShown()).toBe(true)
    }
    expect(datasetResetDialog.lostOperationsWarning()).toBeNull()
  })

  // SYNC-16 — Writes made here and not sent yet will be lost by the
  // reload: the dialog says so, one write…
  it('warns that the one unsent operation will be lost', async () => {
    const { backend } = await aComputerInSync()
    theServerIsReset(backend)

    await correctAnArticle()
    await openScreen('/')
    await datasetResetDialog.shown()

    expect(datasetResetDialog.lostOperationsWarning()).toBe(
      "Une opération saisie sur ce poste n'a pas pu être transmise et sera perdue.",
    )
  })

  // SYNC-16 — … or several.
  it('warns that the N unsent operations will be lost', async () => {
    const { backend } = await aComputerInSync()
    theServerIsReset(backend)

    await app.createDeposit(aDepositForm({ depotIndex: 13 }))
    await openScreen('/')
    await datasetResetDialog.shown()

    expect(datasetResetDialog.lostOperationsWarning()).toBe(
      "3 opérations saisies sur ce poste n'ont pas pu être transmises et seront perdues.",
    )
  })

  // SYNC-17 + PAR-17 — « Recharger depuis le serveur »: the button says it
  // is working, the local copy and its unsent writes are thrown away, the
  // server's base comes in, the new epoch is adopted and the dialog goes.
  // What belongs to this computer stays: its register number, its device
  // id, its cheque printing settings.
  it('reloads the base from the server, keeps the computer settings, and closes the dialog', async () => {
    await db.workstation.put({ key: 'checkPrintOffsets', value: chequeOffsets })
    const { backend } = await aComputerInSync()
    const deviceId = (await settingsPage()).deviceId()
    theServerIsReset(backend)
    await app.createDeposit(aDepositForm({ depotIndex: 13 }))
    const release = backend.holdsInitialSync()
    const { user } = await openScreen('/deposits/listing')
    await datasetResetDialog.shown()

    await datasetResetDialog.reload(user)

    expect(datasetResetDialog.button()).toHaveTextContent('Rechargement…')
    expect(datasetResetDialog.button()).toBeDisabled()
    release()
    await waitFor(() => expect(datasetResetDialog.isShown()).toBe(false))
    const listing = await depositsListingPage()
    await listing.waitForDeposits(1)
    expect(listing.depositNumbers()).toEqual([30])
    const settings = await settingsPage()
    expect(settings.datasetEpoch()).toBe('epoch-2027')
    expect(settings.waitingCount()).toBe(0)
    expect(settings.lastSync()).toBe(
      `Dernière synchronisation = ${DETECTED.toLocaleString()}`,
    )
    expect(settings.currentWorkstation()).toBe(1000)
    expect(settings.workstationBadge()).toBe('Caisse 1000')
    expect(settings.deviceId()).toBe(deviceId)
    expect((await db.workstation.get('checkPrintOffsets'))?.value).toEqual(
      chequeOffsets,
    )
  })

  // SYNC-18 — Once reloaded, this computer's writes reach the server again,
  // under the new epoch.
  it('has its new writes accepted by the server after the reload', async () => {
    const { backend } = await aComputerInSync()
    theServerIsReset(backend)
    await app.createDeposit(aDepositForm({ depotIndex: 13 }))
    const { user } = await openScreen('/')
    await datasetResetDialog.shown()
    await datasetResetDialog.reload(user)
    await waitFor(() => expect(datasetResetDialog.isShown()).toBe(false))
    const before = backend.pushes().length

    await app.createDeposit(aDepositForm({ depotIndex: 14 }))

    await waitFor(() => expect(backend.pushes().length).toBe(before + 3))
    const pushes = backend.requestsTo('/api/push').slice(before)
    expect(
      pushes.every((request) => request.headers.datasetEpoch === 'epoch-2027'),
    ).toBe(true)
    const settings = await settingsPage()
    expect(settings.waitingCount()).toBe(0)
    expect(settings.noRefusedOperation()).toBe(true)
  })

  // The server goes down right when the operator reloads.
  it('leaves the computer with an empty base when the server is unreachable during the reload', async () => {
    const { backend, computer } = await aComputerInSync()
    theServerIsReset(backend)
    await computer.poll()
    const { user } = await openScreen('/deposits/listing')
    await datasetResetDialog.shown()
    backend.goesOffline()

    await datasetResetDialog.reload(user)

    // Current behaviour, pinned until it is decided: the local base is
    // wiped before the server is asked; when it cannot be reached, the
    // dialog closes anyway (the mismatch went with the wipe) and the
    // computer is left with nothing: no deposit, no sync, no epoch, and no
    // message — the worker's SYNC_ERROR is only logged.
    await waitFor(() => expect(datasetResetDialog.isShown()).toBe(false))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(
      screen
        .getAllByRole('row')
        .filter((row) => row.querySelectorAll('td').length > 2),
    ).toEqual([])
    const settings = await settingsPage()
    expect(settings.lastSync()).toBe('Non synchonisé')
    expect(settings.datasetEpoch()).toBe('—')
    expect(settings.currentWorkstation()).toBe(1000)

    // The next poll, the server back, falls back to a full load.
    backend.comesBackOnline()
    await computer.poll()
    const listing = await depositsListingPage()
    await listing.waitForDeposits(1)
    expect(listing.depositNumbers()).toEqual([30])
  })
})
