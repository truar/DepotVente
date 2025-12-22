import { db, type Predeposit } from '@/db.ts'
import { syncService } from '@/services/sync-service.ts'

export function usePredepositsDb() {
  async function update(id: string, data: Partial<Predeposit>) {
    await db.predeposits.upsert(id, data)
    // Add to outbox for syncing
    await syncService.addToOutbox('predeposits', 'update', id, data)
  }

  return { update }
}
