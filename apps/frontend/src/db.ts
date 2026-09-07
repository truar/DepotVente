import Dexie from 'dexie'
import type { EntityTable } from 'dexie'

export type Workstation = {
  incrementStart: number
}

export type Sale = {
  id: string
  buyerId: string
  saleIndex: number
  incrementStart: number
  cardAmount: number | null | undefined
  cashAmount: number | null | undefined
  checkAmount: number | null | undefined
  deferredAmount: number | null | undefined
  totalRefundAmount: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type Refund = {
  id: string
  saleId: string
  incrementStart: number
  cardAmount: number
  cashAmount: number
  comment: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type Deposit = {
  id: string
  contributionStatus:
    | 'A_PAYER'
    | 'PAYE'
    | 'SOLDE'
    | 'PRO'
    | 'GRATUIT'
    | 'DEDUITE'
  contributionAmount: number
  sellerId: string
  incrementStart: number
  dropWorkstationId: number
  depositIndex: number
  type: 'PRO' | 'PARTICULIER'
  returnedCalculationDate?: Date
  soldAmount?: number
  dueContributionAmount?: number
  clubAmount?: number
  sellerAmount?: number
  signatory?: string
  collectedAt?: Date
  collectWorkstationId?: number
  // Caisse qui a encaissé la cotisation soldée le soir (statut SOLDE).
  contributionCollectWorkstationId?: number | null
  checkId?: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type Predeposit = {
  id: string
  predepositIndex: number
  depositId?: string
  sellerFirstName: string
  sellerLastName: string
  sellerPhoneNumber: string
  sellerCity: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type PredepositArticle = {
  id: string
  predepositId: string
  price: number
  category: string
  discipline: string
  brand: string
  model: string
  size: string
  color: string
  year: number
  identificationLetter: string
  articleIndex: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type Article = {
  id: string
  price: number
  category: string
  discipline: string
  brand: string
  model: string
  serialNumber: string | null
  size: string
  color: string
  code: string
  year: number
  status: 'RECEPTION_PENDING' | 'RECEPTION_OK' | 'DELETED' | 'RETURNED' | 'SOLD'
  depositIndex: number
  identificationLetter: string
  articleIndex: number
  depositId: string
  saleId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type Contact = {
  id: string
  lastName: string
  firstName: string
  phoneNumber: string
  city: string | null
  postalCode: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// Lifecycle of a local write waiting to reach the server:
//   pending  - not sent yet
//   syncing  - request in flight
//   failed   - the server or the network did not answer (5xx, timeout);
//              retried automatically with backoff
//   rejected - the server refused the write itself (4xx) or the retries ran
//              out; never retried automatically, needs a human
export type OutboxStatus = 'pending' | 'syncing' | 'failed' | 'rejected'

export type OutboxOperation = {
  id: string // UUID
  timestamp: number // When operation was created
  collection: string // e.g., 'users', 'products'
  operation: 'create' | 'update' | 'delete'
  recordId: string // ID of the record being synced
  data: any // The actual data to sync
  retryCount: number
  lastAttempt?: number
  error?: string
  // Machine-readable reason from the server (e.g. INVALID_DATA), if any
  errorCode?: string
  httpStatus?: number
  status: OutboxStatus
}

export type CashRegisterControl = {
  id: string
  cashRegisterId: number
  type: 'DEPOSIT' | 'SALE' | 'RETURN'
  totalAmount: number
  realCashAmount: number
  theoreticalCashAmount: number
  initialAmount: number
  difference: number
  cash200: number
  cash100: number
  cash50: number
  cash20: number
  cash10: number
  cash5: number
  cash2: number
  cash1: number
  cash05: number
  cash02: number
  cash01: number
  cash005: number
  cash002: number
  cash001: number
  comment?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// Keys:
//   lastSync      - server timestamp of the last successful pull
//   datasetEpoch  - lifetime of the server database this computer synced
//                   against (see the backend's DatasetEpoch model)
//   epochMismatch - set when the server refused us with EPOCH_MISMATCH; the
//                   app then shows the reset dialog until the local base is
//                   rebuilt
export type SyncMetadata = {
  key: string
  value: unknown
}

export type EpochMismatch = {
  serverEpoch: string
  localEpoch: string | null
  detectedAt: number
}

export type WorkstationMetadata = {
  key: string
  value: unknown
}

const db = new Dexie('DepotVenteDatabase') as Dexie & {
  contacts: EntityTable<
    Contact,
    'id' // primary key "id" (for the typings only)
  >
  deposits: EntityTable<
    Deposit,
    'id' // primary key "id" (for the typings only)
  >
  articles: EntityTable<
    Article,
    'id' // primary key "id" (for the typings only)
  >
  predeposits: EntityTable<
    Predeposit,
    'id' // primary key "id" (for the typings only)
  >
  predepositArticles: EntityTable<
    PredepositArticle,
    'id' // primary key "id" (for the typings only)
  >
  sales: EntityTable<Sale, 'id'>
  refunds: EntityTable<Refund, 'id'>
  cashRegisterControls: EntityTable<CashRegisterControl, 'id'>
  outbox: EntityTable<OutboxOperation, 'id'>
  syncMetadata: EntityTable<SyncMetadata, 'key'>
  workstation: EntityTable<WorkstationMetadata, 'key'>
}

// Schema declaration:
db.version(1).stores({
  contacts: '++id',
  deposits: '++id, depositIndex, incrementStart, type, signatory',
  articles: '++id, depositId, saleId, code, articleIndex, [depositId+status]',
  predeposits: '++id, predepositIndex',
  predepositArticles: '++id, predepositId, articleIndex',
  sales: '++id, incrementStart, saleIndex',
  outbox: '++id, timestamp, status, collection',
  cashRegisterControls: '++id, [cashRegisterId+type]',
  syncMetadata: 'key',
  workstation: 'key',
})

db.version(2).stores({
  refunds: '++id, saleId, incrementStart, updatedAt',
})

export { db }
