import Dexie, { type EntityTable } from 'dexie'

export type Workstation = {
  id: string
  incrementStart: number
  name: string
}

export type Deposit = {
  id: string
  contributionStatus: string
  sellerId: string
  incrementStart: number
  dropWorkstationId: number
  depositIndex: number
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
  depositIndex: number
  articleIndex: string
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
  outbox: EntityTable<OutboxOperation, 'id'>
}

// Schema declaration:
db.version(1).stores({
  contacts: '++id',
  deposits: '++id, incrementStart',
  articles: '++id, depotId, code',
  outbox: '++id, timestamp, status, collection',
})

export { db }
