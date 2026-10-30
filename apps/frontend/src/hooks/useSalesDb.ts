import { db, type Sale, type Workstation } from '@/db.ts'
import { syncService } from '@/services/sync-service.ts'

export function useSalesDb() {
  // Le numéro de la prochaine vente : le plus grand de la caisse + 1, et non
  // son nombre de ventes + 1 qui, passé un trou dans les numéros, en
  // redonnait un déjà pris. Une vente supprimée garde le sien.
  async function nextIndex(workstation: Workstation) {
    const sales = await db.sales
      .where({ incrementStart: workstation.incrementStart })
      .toArray()
    return (
      sales.reduce(
        (max, sale) => Math.max(max, sale.saleIndex),
        workstation.incrementStart,
      ) + 1
    )
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

  return { nextIndex, insert, update }
}
