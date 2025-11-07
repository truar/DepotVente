import Dexie, { type EntityTable } from 'dexie'

interface Depot {
  id: string
  workstation: string
  userId: string
}
interface Article {
  id: string
  depotId: string
  price: number
  description: string
  brand: string
  type: string
  size: string
  color: string
  model: string
  workstation: string
  articleCode: string
}
interface User {
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
  depots: '++id',
  articles: '++id, depotId, articleCode',
})

export type { Depot, User }
export { db }
