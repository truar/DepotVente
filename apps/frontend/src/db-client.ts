import { createClient } from '@supabase/supabase-js'
import { createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage'
import { replicateSupabase } from 'rxdb/plugins/replication-supabase'

export const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL!,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!,
  // optional options object here
)

export const db = await createRxDatabase({
  name: 'depot-vente-database',
  storage: getRxStorageLocalstorage(),
})

// Add collections for sellers, buyers, and articles
await db.addCollections({
  sellers: {
    schema: {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 100 }, // Primary key
        first_name: { type: 'string', maxLength: 50 },
        last_name: { type: 'string', maxLength: 50 },
        phone_number: {
          type: 'string',
          pattern: '^0[1-9][0-9]{8}$', // French phone number validation
        },
        _deleted: { type: 'boolean', default: false },
        _modified: { type: 'string', format: 'date-time' },
      },
      required: [
        'id',
        'first_name',
        'last_name',
        'phone_number',
        '_deleted',
        '_modified',
      ],
    },
  },
  buyers: {
    schema: {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 100 }, // Primary key
        first_name: { type: 'string', maxLength: 50 },
        last_name: { type: 'string', maxLength: 50 },
        phone_number: {
          type: 'string',
          pattern: '^0[1-9][0-9]{8}$', // French phone number validation
        },
        _deleted: { type: 'boolean', default: false },
        _modified: { type: 'string', format: 'date-time' },
      },
      required: [
        'id',
        'first_name',
        'last_name',
        'phone_number',
        '_deleted',
        '_modified',
      ],
    },
  },
  articles: {
    schema: {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 100 }, // Primary key
        seller_id: { type: 'string', maxLength: 100 }, // Foreign key reference to sellers
        price: { type: 'number', minimum: 0 },
        short_description: { type: 'string' },
        brand: { type: 'string', maxLength: 50 },
        type: { type: 'string' },
        size: { type: 'string' },
        color: { type: 'string', maxLength: 30 },
        buyer_id: { type: 'string', maxLength: 100 }, // Foreign key reference to buyers
        purchase_date: { type: 'string', format: 'date-time' },
        _deleted: { type: 'boolean', default: false },
        _modified: { type: 'string', format: 'date-time' },
      },
      required: [
        'id',
        'seller_id',
        'price',
        'short_description',
        'type',
        '_deleted',
        '_modified',
      ],
    },
  },
})

const articlesReplication = replicateSupabase({
  tableName: 'articles',
  client: supabase,
  collection: db.articles,
  replicationIdentifier: 'articles-replication',
  live: true,
  pull: {
    batchSize: 50,
  },
  push: {
    batchSize: 50,
  },
})

// (optional) observe errors and wait for the first sync barrier
articlesReplication.error$.subscribe((err) =>
  console.error('[articlesReplication]', err),
)
await articlesReplication.awaitInitialReplication()

const buyersReplication = replicateSupabase({
  tableName: 'buyers',
  client: supabase,
  collection: db.buyers,
  replicationIdentifier: 'buyers-replication',
  live: true,
  pull: {
    batchSize: 50,
  },
  push: {
    batchSize: 50,
  },
})

// (optional) observe errors and wait for the first sync barrier
buyersReplication.error$.subscribe((err) =>
  console.error('[articlesReplication]', err),
)
await buyersReplication.awaitInitialReplication()

const sellersReplication = replicateSupabase({
  tableName: 'sellers',
  client: supabase,
  collection: db.sellers,
  replicationIdentifier: 'sellers-replication',
  live: true,
  pull: {
    batchSize: 50,
  },
  push: {
    batchSize: 50,
  },
})

// (optional) observe errors and wait for the first sync barrier
sellersReplication.error$.subscribe((err) =>
  console.error('[articlesReplication]', err),
)
await sellersReplication.awaitInitialReplication()
