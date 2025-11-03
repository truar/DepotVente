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

await db.addCollections({
  notes: {
    schema: {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 100 },
        title: { type: 'string' },
      },
      required: ['id', 'title'],
    },
  },
})

const replication = replicateSupabase({
  tableName: 'notes',
  client: supabase,
  collection: db.notes,
  replicationIdentifier: 'depot-vente-supabase',
  live: true,
  pull: {
    batchSize: 50,
  },
  push: {
    batchSize: 50,
  },
})

// (optional) observe errors and wait for the first sync barrier
replication.error$.subscribe((err) => console.error('[replication]', err))
await replication.awaitInitialReplication()
