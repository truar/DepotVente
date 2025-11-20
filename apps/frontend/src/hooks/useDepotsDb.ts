import { db, type Deposit } from '@/db.ts'
import { useWorkstation } from './useWorkstation'
import { syncService } from '@/sync-service.ts'

export function useDepotsDb() {
  const [workstation] = useWorkstation()

  function count() {
    if (!workstation) return Promise.resolve(0)
    return db.deposits
      .where({ incrementStart: workstation?.incrementStart })
      .count()
  }

  async function insert(depot: Deposit) {
    const depotId = await db.deposits.add(depot)
    // Add to outbox for syncing
    await syncService.addToOutbox(
      'deposits',
      'create', // or 'create' based on your logic
      depot.id,
      depot,
    )
    return depotId
  }
  return { insert, count }
}
