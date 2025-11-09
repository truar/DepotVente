import Dexie, { type EntityTable } from 'dexie'

export interface Depot {
  id: string
  workstation: number
  userId: string
  depotIndex: number
}

export interface Article {
  id: string
  depotId: string
  price: number
  description: string
  brand: string
  type: string
  size: string
  color: string
  model: string
  workstation: number
  articleCode: string
  year: number
  depotIndex: number
  articleIndex: string
}
export interface User {
  id: string
  lastName: string
  firstName: string
  phoneNumber: string
}

const db = new Dexie('DepotVenteDatabase') as Dexie & {
  users: EntityTable<
    User,
    'id' // primary key "id" (for the typings only)
  >
  depots: EntityTable<
    Depot,
    'id' // primary key "id" (for the typings only)
  >
  articles: EntityTable<
    Article,
    'id' // primary key "id" (for the typings only)
  >
}

// Schema declaration:
db.version(1).stores({
  users: '++id', // primary key "id" (for the runtime!)
  depots: '++id, workstation',
  articles: '++id, depotId, articleCode',
})

export { db }
