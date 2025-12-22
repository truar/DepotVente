import { db, type Sale, type Workstation } from '@/db.ts'
import { syncService } from '@/services/sync-service.ts'

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

  async function update(id: string, data: Partial<Sale>) {
    await db.sales.upsert(id, data)
    // Add to outbox for syncing
    await syncService.addToOutbox('sales', 'update', id, data)
  }

  return { count, insert, update }
}
