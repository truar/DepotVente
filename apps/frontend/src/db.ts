import Dexie, { type EntityTable } from 'dexie'

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
  refundCardAmount: number | null | undefined
  refundCashAmount: number | null | undefined
  refundComment: string | null | undefined
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type Deposit = {
  id: string
  contributionStatus: 'A_PAYER' | 'PAYEE' | 'PRO' | 'GRATUIT' | 'DEDUITE'
  contributionAmount: number
  sellerId: string
  incrementStart: number
  dropWorkstationId: number
  depositIndex: number
  type: 'PRO' | 'PARTICULIER'
  returnedCalculationDate?: Date
  soldAmount?: number
  clubAmount?: number
  sellerAmount?: number
  signatory?: string
  collectedAt?: Date
  collectWorkstationId?: number
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
  size: string
  color: string
  code: string
  year: number
  status: 'RECEPTION_PENDING' | 'RECEPTION_OK' | 'REFUSED' | 'RETURNED' | 'SOLD'
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
  status: 'pending' | 'syncing' | 'failed'
}

export type CashRegisterControl = {
  id: string
  cashRegisterId: number
  type: 'DEPOSIT' | 'SALE'
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
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type SyncMetadata = {
  key: string
  value: unknown
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
  cashRegisterControls: '++id, cashRegisterId',
  syncMetadata: 'key',
  workstation: 'key',
})

export { db }
