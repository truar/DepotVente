import { createCollection } from '@tanstack/react-db'
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection'
import { db } from '@/db-client.ts'

export const articlesCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: db.articles,
    startSync: true, // start ingesting RxDB data immediately
  }),
)

export const sellersCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: db.sellers,
    startSync: true, // start ingesting RxDB data immediately
  }),
)

export const buyersCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: db.buyers,
    startSync: true, // start ingesting RxDB data immediately
  }),
)
