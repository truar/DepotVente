import { db, type Deposit, type Workstation } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useDepotsDb() {
  function count(workstation: Workstation) {
    return db.deposits
      .where({ incrementStart: workstation.incrementStart })
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
