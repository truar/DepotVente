// What stands behind the Paramètres screen: this computer's sync loop and
// the server it talks to.
//
// In the browser the sync loop runs in a Web Worker (src/workers/
// sync.worker.ts), which jsdom cannot start. `bootComputer` puts an
// in-process stand-in in its place: the real SyncManager creates it, posts it
// the same messages, and it answers them the way the worker does, through the
// same SyncService. Each boot loads its own instance of the sync service, as
// opening the browser starts a new worker; the 20 s polling interval is
// replaced by `computer.poll()`, so a story says when a poll happens.
//
// `givenServer` stands in for the backend with msw, following its contract
// (apps/backend/src/sync): JWT on everything but /sync/ping, the dataset epoch
// required on /push and /sync/delta (400 EPOCH_REQUIRED when absent, 409
// EPOCH_MISMATCH when stale), errors as `{ code, message }`. It keeps every
// request it received, headers and body, for the story to look at.
import { HttpResponse, http } from 'msw'
import { vi } from 'vitest'
import type { Article, Contact, Deposit } from '@/db.ts'
import type { syncService } from '@/services/sync-service.ts'
import { db } from '@/db.ts'
import { getDeviceId } from '@/services/client-identity.ts'
import { YEAR } from '@/test/harness.ts'
import { server } from '@/test/server.ts'
import { generateArticleCode } from '@/utils'
import { syncManager } from '@/sync-manager.ts'

type SyncService = typeof syncService
type SyncServiceModule = { syncService: SyncService }

// ---------------------------------------------------------------------------
// The server
// ---------------------------------------------------------------------------

export type Dataset = {
  deposits: Array<unknown>
  articles: Array<unknown>
  contacts: Array<unknown>
  sales: Array<unknown>
  refunds: Array<unknown>
  predeposits: Array<unknown>
  predepositArticles: Array<unknown>
  cashRegisterControls: Array<unknown>
}

const COLLECTIONS: Array<keyof Dataset> = [
  'deposits',
  'articles',
  'contacts',
  'sales',
  'refunds',
  'predeposits',
  'predepositArticles',
  'cashRegisterControls',
]

function emptyDataset(): Dataset {
  return {
    deposits: [],
    articles: [],
    contacts: [],
    sales: [],
    refunds: [],
    predeposits: [],
    predepositArticles: [],
    cashRegisterControls: [],
  }
}

// What the client sends on /push (see SyncService.syncOperation).
export type Push = {
  operationId: string
  collection: string
  operation: 'create' | 'update' | 'delete'
  recordId: string
  data: Record<string, unknown>
  timestamp: number
}

export type ReceivedRequest = {
  method: string
  // Path and query, e.g. "/api/sync/delta?since=1700000000000".
  path: string
  // The server clock when it arrived (the fake one when a story fakes it).
  at: number
  headers: {
    authorization: string | null
    deviceId: string | null
    workstation: string | null
    appVersion: string | null
    datasetEpoch: string | null
  }
  body: unknown
}

// How the server answers one push: accepted, refused with a status and an
// error body, or never reached (network down).
export type PushAnswer =
  | 'accepted'
  | 'network-error'
  | { status: number; code?: string; message?: string }

export const VALID_TOKEN = 'test-token'

export function givenServer({
  epoch = 'epoch-2026',
  dataset = {},
}: { epoch?: string; dataset?: Partial<Dataset> } = {}) {
  const state = {
    epoch,
    dataset: { ...emptyDataset(), ...dataset },
    // Records written on other computers since the server started, with the
    // time they reached it: what a delta hands out.
    published: [] as Array<{
      at: number
      collection: keyof Dataset
      row: unknown
    }>,
    tokens: new Set([VALID_TOKEN]),
    reachable: true,
    answerPush: (_push: Push): PushAnswer | Promise<PushAnswer> => 'accepted',
    answerDelta: null as null | {
      status: number
      code: string
      message: string
    },
    answerInitial: null as null | {
      status: number
      code: string
      message: string
    },
    // While set, /sync/initial answers only once it resolves.
    initialHeld: null as Promise<void> | null,
  }
  const received: Array<ReceivedRequest> = []
  const isReachable = () => state.reachable

  async function record(request: Request) {
    const url = new URL(request.url)
    let body: unknown = undefined
    if (request.method === 'POST') {
      body = await request
        .clone()
        .json()
        .catch(() => undefined)
    }
    received.push({
      method: request.method,
      path: url.pathname + url.search,
      at: Date.now(),
      headers: {
        authorization: request.headers.get('Authorization'),
        deviceId: request.headers.get('X-Device-Id'),
        workstation: request.headers.get('X-Workstation'),
        appVersion: request.headers.get('X-App-Version'),
        datasetEpoch: request.headers.get('X-Dataset-Epoch'),
      },
      body,
    })
  }

  // JwtAuthGuard then DatasetEpochGuard, as the backend chains them.
  function guard(
    request: Request,
    { epochRequired }: { epochRequired: boolean },
  ): Response | null {
    const authorization = request.headers.get('Authorization') ?? ''
    if (!state.tokens.has(authorization.replace(/^Bearer /, ''))) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 },
      )
    }
    if (!epochRequired) return null
    const clientEpoch = request.headers.get('X-Dataset-Epoch')
    if (!clientEpoch) {
      return HttpResponse.json(
        {
          code: 'EPOCH_REQUIRED',
          message: 'Le client doit indiquer son epoch de données.',
          serverEpoch: state.epoch,
        },
        { status: 400 },
      )
    }
    if (clientEpoch !== state.epoch) {
      return HttpResponse.json(
        {
          code: 'EPOCH_MISMATCH',
          message:
            'La base de données du serveur a été réinitialisée depuis la dernière synchronisation de ce poste.',
          serverEpoch: state.epoch,
        },
        { status: 409 },
      )
    }
    return null
  }

  function rowsSince(since: number): Dataset {
    const changes = emptyDataset()
    for (const { at, collection, row } of state.published) {
      if (at >= since) changes[collection].push(row)
    }
    return changes
  }

  server.use(
    http.get('/api/sync/ping', async ({ request }) => {
      await record(request)
      if (!state.reachable) return HttpResponse.error()
      return HttpResponse.json({
        status: 'ok',
        timestamp: Date.now(),
        datasetEpoch: state.epoch,
      })
    }),
    http.get('/api/sync/initial', async ({ request }) => {
      await record(request)
      if (!state.reachable) return HttpResponse.error()
      if (state.initialHeld) {
        await state.initialHeld
        // The network may have dropped while the answer was held.
        if (!isReachable()) return HttpResponse.error()
      }
      const refused = guard(request, { epochRequired: false })
      if (refused) return refused
      if (state.answerInitial) {
        const { status, ...error } = state.answerInitial
        return HttpResponse.json(error, { status })
      }
      const everything = rowsSince(0)
      const body: Record<string, unknown> = {
        syncedAt: Date.now(),
        datasetEpoch: state.epoch,
      }
      for (const collection of COLLECTIONS) {
        body[collection] = [
          ...state.dataset[collection],
          ...everything[collection],
        ]
      }
      return HttpResponse.json(body)
    }),
    http.get('/api/sync/delta', async ({ request }) => {
      await record(request)
      if (!state.reachable) return HttpResponse.error()
      const refused = guard(request, { epochRequired: true })
      if (refused) return refused
      if (state.answerDelta) {
        const { status, ...error } = state.answerDelta
        return HttpResponse.json(error, { status })
      }
      const since = Number(new URL(request.url).searchParams.get('since'))
      return HttpResponse.json({
        ...rowsSince(since),
        syncedAt: Date.now(),
        datasetEpoch: state.epoch,
      })
    }),
    http.post('/api/push', async ({ request }) => {
      await record(request)
      if (!state.reachable) return HttpResponse.error()
      const refused = guard(request, { epochRequired: true })
      if (refused) return refused
      const answer = await state.answerPush(
        (await request.clone().json()) as Push,
      )
      if (answer === 'network-error') return HttpResponse.error()
      if (answer === 'accepted') {
        return HttpResponse.json({ applied: true, datasetEpoch: state.epoch })
      }
      return HttpResponse.json(
        {
          code: answer.code ?? `HTTP_${answer.status}`,
          message: answer.message ?? 'Refusé',
        },
        { status: answer.status },
      )
    }),
    // Login, as the login screen does it (see ApiAuthService).
    http.post('/api/signin', async ({ request }) => {
      await record(request)
      state.tokens.add('fresh-token')
      return HttpResponse.json({ token: 'fresh-token' })
    }),
    http.get('/api/protected', async ({ request }) => {
      await record(request)
      return HttpResponse.json({
        payload: {
          id: 'user-under-test',
          email: 'admin@test',
          password: '',
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    }),
    http.post('/api/logout', async ({ request }) => {
      await record(request)
      return new HttpResponse(null, { status: 204 })
    }),
  )

  const fakeServer = {
    received,
    // The requests on one endpoint, e.g. '/api/push' or '/api/sync/delta'.
    requestsTo(pathname: string) {
      return received.filter(
        (request) => request.path.split('?')[0] === pathname,
      )
    },
    // Every push attempt, accepted or not, in the order it arrived.
    pushes(): Array<Push> {
      return fakeServer
        .requestsTo('/api/push')
        .map((request) => request.body as Push)
    },
    // [collection, operation, recordId] of each push attempt.
    pushedRecords() {
      return fakeServer
        .pushes()
        .map((push) => [push.collection, push.operation, push.recordId])
    },
    answerPushes(answer: (push: Push) => PushAnswer | Promise<PushAnswer>) {
      state.answerPush = answer
    },
    answerDeltasWith(
      error: { status: number; code: string; message: string } | null,
    ) {
      state.answerDelta = error
    },
    // /sync/initial answers this error (null: the full base again).
    answerInitialWith(
      error: { status: number; code: string; message: string } | null,
    ) {
      state.answerInitial = error
    },
    // The network between this computer and the server is down (cable,
    // Wi-Fi, server off): every request fails before reaching it.
    goesOffline() {
      state.reachable = false
    },
    comesBackOnline() {
      state.reachable = true
    },
    // Every token issued so far stops being valid (expired, server secret
    // rotated): requests answer 401 until someone logs in again.
    revokesTokens() {
      state.tokens.clear()
    },
    // The full base takes its time to come (a big dump on a slow
    // network): /sync/initial answers when the returned function is called.
    holdsInitialSync(): () => void {
      let release = () => {}
      state.initialHeld = new Promise<void>((resolve) => {
        release = () => {
          state.initialHeld = null
          resolve()
        }
      })
      return release
    },
    // The server database is rebuilt (between two test sessions): a new
    // epoch, a new dataset, nothing published since.
    resetsDatabase(newEpoch: string, rebuilt: Partial<Dataset> = {}) {
      state.epoch = newEpoch
      state.dataset = { ...emptyDataset(), ...rebuilt }
      state.published = []
    },
    // Records another computer pushed: the next delta hands them out. Sent
    // as JSON, as the server sends them (dates become ISO strings).
    publishes(changes: Partial<Dataset>) {
      const at = Date.now()
      for (const collection of COLLECTIONS) {
        for (const row of changes[collection] ?? []) {
          state.published.push({
            at,
            collection,
            row: JSON.parse(JSON.stringify(row)),
          })
        }
      }
    },
    epoch: () => state.epoch,
  }
  return fakeServer
}

export type FakeServer = ReturnType<typeof givenServer>

// A deposit registered on another computer, as the server holds it: its
// seller, the deposit, one article. Ids derive from the deposit number.
export function aServerDeposit(depositIndex: number, lastName: string) {
  const now = new Date()
  const seller: Contact = {
    id: `seller-${depositIndex}`,
    lastName,
    firstName: 'Paul',
    phoneNumber: '0644444444',
    city: 'Lyon',
    postalCode: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  const deposit: Deposit = {
    id: `deposit-${depositIndex}`,
    type: 'PARTICULIER',
    sellerId: seller.id,
    contributionStatus: 'PAYE',
    contributionAmount: 2,
    depositIndex,
    incrementStart: 1000,
    dropWorkstationId: 2,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  const article: Article = {
    id: `article-${depositIndex}`,
    depositId: deposit.id,
    saleId: null,
    status: 'RECEPTION_OK',
    code: generateArticleCode(YEAR, depositIndex, 'A'),
    price: 120,
    category: 'Skis',
    discipline: 'Alpin',
    brand: 'Rossignol',
    model: 'Hero',
    serialNumber: null,
    size: '170',
    color: 'rouge',
    year: YEAR - 3,
    depositIndex,
    identificationLetter: 'A',
    articleIndex: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  return { contacts: [seller], deposits: [deposit], articles: [article] }
}

// ---------------------------------------------------------------------------
// This computer's sync loop
// ---------------------------------------------------------------------------

let boots = 0
const running: Array<SyncService> = []

// One message the manager posted, and what the stand-in answered.
type WorkerMessage = { type: string; payload?: unknown }

// Answers the manager's messages as src/workers/sync.worker.ts does. Every
// message is handled as it arrives, without waiting for the previous one,
// as the worker's async onmessage does.
class InProcessSyncWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null
  readonly replies: Array<unknown> = []
  // Resolves once the first sync of START_SYNC (full or delta) is over.
  started: Promise<void> = Promise.resolve()

  constructor(private readonly service: SyncService) {}

  postMessage({ type, payload }: WorkerMessage) {
    const handled = this.handle(type, payload)
    if (type === 'START_SYNC') this.started = handled
  }

  private reply(data: unknown) {
    this.replies.push(data)
    this.onmessage?.({ data })
  }

  private async handle(type: string, payload: unknown) {
    const service = this.service
    switch (type) {
      case 'SET_TOKEN':
        service.setToken(payload as string | null)
        break
      case 'INITIAL_SYNC':
        try {
          await service.initialSync()
          this.reply({ type: 'SYNC_COMPLETE' })
        } catch (error) {
          this.reply({ type: 'SYNC_ERROR', error })
        }
        break
      case 'START_SYNC':
        service.startSync()
        // A failed first sync is logged by the service and left to the
        // next poll, as in the worker.
        try {
          await service.softInitialSync()
          await service.deltaSync()
        } catch {
          // Logged by the service already.
        }
        break
      case 'PROCESS_OUTBOX':
        await service.processOutbox()
        break
      case 'RESET_LOCAL':
        this.reply({
          type: 'RESET_LOCAL_DONE',
          result: await service.resetLocal(),
        })
        break
    }
  }
}

export type Computer = Awaited<ReturnType<typeof bootComputer>>

// Opens the application on this computer: main.tsx calls syncManager.init(),
// which starts the sync worker with the session token kept by the login
// (localStorage) and starts the sync. A computer booted earlier is closed
// first, as a browser restart would.
//
// The browser already has its device id, created at its first launch. (The
// test setup empties the base before each story but the id stays in
// memory: it is written back.) `firstLaunch` opens a browser that never
// had one — only meaningful in the first story of a file.
export async function bootComputer({
  firstLaunch = false,
}: { firstLaunch?: boolean } = {}) {
  if (!firstLaunch) {
    await db.workstation.put({ key: 'deviceId', value: await getDeviceId() })
  }
  shutDownComputers()
  boots += 1
  // A separate module instance per boot: a fresh worker, nothing carried
  // over in memory from the previous one (token, queue state, timers).
  const instancePath = `@/services/sync-service.ts?computer=${boots}`
  const { syncService: service } = (await import(
    /* @vite-ignore */ instancePath
  )) as SyncServiceModule
  running.push(service)

  let worker: InProcessSyncWorker | null = null
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        worker = new InProcessSyncWorker(service)
        return worker
      }
    },
  )
  // The manager keeps the worker it started for the life of the page; a
  // new page starts a new one.
  Reflect.set(syncManager, 'worker', null)
  syncManager.init()
  // The application is usable at once, but the stories start from a
  // computer that has done its first sync.
  const started = worker as InProcessSyncWorker | null
  await started?.started

  return {
    // One tick of the worker's 20 s polling interval.
    poll: () => service.deltaSync(),
    // What the worker posted back to the page (SYNC_COMPLETE, SYNC_ERROR,
    // RESET_LOCAL_DONE).
    replies: () => started?.replies ?? [],
  }
}

// Closes the application: the worker is gone with its timers. Its service
// instance stays in memory here, so it is disarmed (without a token it
// pushes nothing, and it is never asked to poll again).
export function shutDownComputers() {
  for (const service of running.splice(0)) service.setToken(null)
  Reflect.set(syncManager, 'worker', null)
  vi.unstubAllGlobals()
}

// ---------------------------------------------------------------------------
// A fake clock, for the retry delays (seconds to minutes)
// ---------------------------------------------------------------------------

// Only the sync's own timers are held back: the retry delays the service
// schedules (setTimeout called from sync-service.ts) wait for the story to
// move the clock, and Date follows. Every other timer stays real: Dexie
// signals its live queries with a setTimeout(0), and the HTTP client under
// fetch keeps its sockets on timers too; faking those (vi.useFakeTimers on
// setTimeout) leaves them stalled once the clock is given back, and hangs
// the next story.
const realSetTimeout = globalThis.setTimeout
const heldTimers: Array<{ at: number; run: () => void }> = []

function syncAwareSetTimeout(
  callback: (...args: Array<unknown>) => void,
  ms = 0,
  ...args: Array<unknown>
) {
  if (new Error().stack?.includes('sync-service.ts')) {
    heldTimers.push({ at: Date.now() + ms, run: () => callback(...args) })
    return 0 as unknown as ReturnType<typeof setTimeout>
  }
  return realSetTimeout(callback, ms, ...args)
}

export function fakeClock(now = new Date('2026-11-14T08:00:00')) {
  vi.useFakeTimers({ toFake: ['Date'], now })
  globalThis.setTimeout = syncAwareSetTimeout as typeof setTimeout
}

// Moves the clock to the sync's next timer and runs it. False when the sync
// has nothing scheduled.
export function nextSyncTimer(): boolean {
  heldTimers.sort((a, b) => a.at - b.at)
  const next = heldTimers.shift()
  if (!next) return false
  if (next.at > Date.now()) vi.setSystemTime(next.at)
  next.run()
  return true
}

// Lets this computer finish what it is doing (IndexedDB, HTTP), without
// moving the clock.
export async function settle(rounds = 30) {
  for (let i = 0; i < rounds; i++) {
    await new Promise((resolve) => setImmediate(resolve))
  }
}

// Back to the real clock; the sync's held timers are dropped (its
// computers are shut down by then).
export function realClock() {
  globalThis.setTimeout = realSetTimeout
  heldTimers.length = 0
  vi.useRealTimers()
}
