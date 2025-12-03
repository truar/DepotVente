import { db, type Sale, type Workstation } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useSalesDb() {
  function count(workstation: Workstation) {
    return db.sales
      .where({ incrementStart: workstation.incrementStart })
      .count()
  }

  async function insert(sale: Sale) {
    const saleId = await db.sales.add(sale)
    // Add to outbox for syncing
    await syncService.addToOutbox(
      'sales',
      'create', // or 'create' based on your logic
      saleId,
      sale,
    )
    return saleId
  }

  return { count, insert }
}
