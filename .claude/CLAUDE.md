# DepotVente — Architecture Notes

## Local-first, server-as-propagator

This application is **frontend-first**. The backend is *not* the source of
truth for an active session — it is just a propagation hub.

- **Source of truth (live):** each computer's local **IndexedDB**.
- **Server role:** accept writes pushed from clients, persist them in
  PostgreSQL, and make them available for the other clients to pull on
  their next poll. The backend is intentionally thin.
- **Write path:** UI writes to local IndexedDB first, then asynchronously
  pushes the change to the server.
- **Read path:** every client **polls the server every X seconds** to pull
  changes that originated on other clients, and merges them into its own
  IndexedDB.

So every computer ends up with its own full copy of the dataset, kept
loosely in sync via *push-on-write + poll-on-read*.

## Concurrency is intentionally naïve

There is **no merge logic, no CRDT, no conflict resolution**. The physical
workflow of a second-hand sport sale guarantees that no two computers ever
mutate the same record at the same time:

- **Deposit phase:** ~3 dedicated computers register sellers and their
  articles. The article is written to local IndexedDB → propagated to the
  server → replicated to the other computers on their next poll.
- A human then physically places those articles on the shop shelves.
- **Sale phase (minutes later):** buyers walk in, pick items, and pay at a
  *different* set of computers dedicated to checkout.

Because deposit and sale happen on **different computers**, in **different
phases**, separated by **minutes** — the same article is never touched by
two writers at the same time. Conflict-freedom is a property of the
**physical setup**, not of the code.

### Implications when working on this codebase

- **Do not** add merge / conflict-resolution logic. It would solve a problem
  the workflow already prevents, and adds complexity for no gain.
- Backend endpoints are mostly thin "accept this change and replicate it";
  business logic lives on the frontend, against the local IndexedDB copy.
- UI reads should generally come from local IndexedDB, not direct server
  fetches. The polling sync loop is the only thing that talks to the server
  on the read path.

## Physical architecture map

```
                              ┌──────────────────────────────┐
                              │           SERVER             │
                              │  ┌────────────────────────┐  │
                              │  │  Backend (NestJS)      │  │
                              │  │  • accept writes       │  │
                              │  │  • serve poll reads    │  │
                              │  │  • trigger replication │  │
                              │  └───────────┬────────────┘  │
                              │              │               │
                              │  ┌───────────▼────────────┐  │
                              │  │  PostgreSQL (Prisma)   │  │
                              │  │  master / hub copy     │  │
                              │  └────────────────────────┘  │
                              └──────┬─────────┬─────────┬───┘
                                     │         │         │
                  push writes  ──────┤         │         ├──────  push writes
                  poll every Xs ─────┤         │         ├──────  poll every Xs
                                     │         │         │
       ═══════════════ DEPOSIT SIDE ═════════════════════════════════════════
       │             │             │         │         │
   ┌───▼────┐   ┌────▼───┐   ┌─────▼──┐      │         │
   │ Depot  │   │ Depot  │   │ Depot  │      │         │
   │ PC #1  │   │ PC #2  │   │ PC #3  │      │         │
   │ ┌────┐ │   │ ┌────┐ │   │ ┌────┐ │      │         │
   │ │IDB │ │   │ │IDB │ │   │ │IDB │ │      │         │
   │ └────┘ │   │ └────┘ │   │ └────┘ │      │         │
   └────────┘   └────────┘   └────────┘      │         │
       ▲            ▲            ▲           │         │
       │            │            │           │         │
   ┌───┴────────────┴────────────┴───┐       │         │
   │  Sellers register articles      │       │         │
   │  → article saved local first    │       │         │
   │  → then pushed to server        │       │         │
   └─────────────────────────────────┘       │         │
                  │                          │         │
                  │  human carries articles  │         │
                  ▼                          │         │
            ┌──────────────────────────┐     │         │
            │   THE SHOP (physical)    │     │         │
            │   articles on shelves    │     │         │
            └────────────┬─────────────┘     │         │
                         │                   │         │
                         │  minutes later    │         │
                         │  buyer picks &    │         │
                         │  walks to till    │         │
                         ▼                   │         │
       ═══════════════ SALE SIDE ════════════│═════════│════════════
                                             │         │
                                       ┌─────▼──┐  ┌───▼────┐
                                       │ Sale   │  │ Sale   │   (N
                                       │ PC #A  │  │ PC #B  │   computers)
                                       │ ┌────┐ │  │ ┌────┐ │
                                       │ │IDB │ │  │ │IDB │ │
                                       │ └────┘ │  │ └────┘ │
                                       └────────┘  └────────┘
                                            ▲         ▲
                                            │         │
                                       ┌────┴─────────┴────┐
                                       │ Cashier scans/    │
                                       │ rings up articles │
                                       │ → sale saved      │
                                       │   local first     │
                                       │ → pushed to server│
                                       └───────────────────┘

   Time axis  ──────────────►   deposit phase ──── shop phase ──── sale phase
                                                                   (minutes
                                                                   later)
```

### Key invariants encoded by this map

- A given **article** is written by exactly one Depot PC during deposit,
  then later read/updated by exactly one Sale PC during checkout. Never
  two writers at once.
- Each PC has its **own IndexedDB**; the server's PostgreSQL is the hub,
  not the live source of truth for the UI.
- All cross-PC visibility flows through:
  *local write → push to server → other PCs see it on their next poll
  (every X seconds)*.
- The "minutes later" gap between deposit and sale is what makes the
  naïve concurrency model safe — by the time a buyer is at a Sale PC, the
  article has already been replicated everywhere via at least one poll
  cycle.

## Sync contract (what the thin backend actually enforces)

The backend is NestJS on the Fastify adapter (`apps/backend/src/app.module.ts`).
It stays thin, but three things are part of the contract every client honours:

- **Dataset epoch.** One row (`DatasetEpoch`) identifies the current lifetime
  of the server database. `/api/sync/initial` and `/api/sync/ping` return it;
  `/api/push` and `/api/sync/delta` require it as `X-Dataset-Epoch` and answer
  `409 EPOCH_MISMATCH` when it names a previous database. A client that gets
  that pauses all sync and asks the operator to rebuild the local base. This is
  how a server reset during tests is detected instead of silently corrupting
  pushes.
- **Client identity.** Every request carries `X-Device-Id` (uuid generated once
  per browser), `X-Workstation` (cash register number) and `X-App-Version`
  (build). The backend tags every log line with them; `pnpm traces` reads those
  logs (see `scripts/traces.mjs`).
- **Final vs transient answers.** Any `4xx` from `/api/push` is final: the
  client parks the write as `rejected` (visible in Paramètres) and moves on.
  Only network errors and `5xx` are retried. The outbox is pushed in write
  order (`timestamp`, then `seq`), because a deposit written in the same
  transaction as its contact must reach the server after it.

Do not weaken any of these three when touching the sync code; the integration
tests in `apps/backend/test` and `apps/frontend/src/test` pin them.
