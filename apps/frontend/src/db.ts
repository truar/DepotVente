import Dexie, { type EntityTable } from 'dexie'
import { ContributionStatusEnum } from '@/types/depotForm.ts'

export type Workstation = {
  id: string
  incrementStart: number
  name: string
}

export type Sale = {
  id: string
  buyerId: string
  saleIndex: number
  incrementStart: number
  cardAmount: number | null
  cashAmount: number | null
  checkAmount: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type Deposit = {
  id: string
  contributionStatus: ContributionStatusEnum
  contributionAmount: number
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

export type SyncMetadata = {
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
  sales: EntityTable<Sale, 'id'>
  outbox: EntityTable<OutboxOperation, 'id'>
  syncMetadata: EntityTable<SyncMetadata, 'key'>
}

// Schema declaration:
db.version(1).stores({
  contacts: '++id',
  deposits: '++id, incrementStart',
  articles: '++id, depotId, code',
  sales: '++id, incrementStart',
  outbox: '++id, timestamp, status, collection',
  syncMetadata: 'key',
})

export { db }
