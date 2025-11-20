import { db, type Sale } from '@/db.ts'
import { useWorkstation } from './useWorkstation'

export function useSalesDb() {
  const [workstation] = useWorkstation()

  function count() {
    if (!workstation) return Promise.resolve(0)
    return db.sales
      .where({ incrementStart: workstation?.incrementStart })
      .count()
  }

  async function insert(sale: Sale) {
    const saleId = await db.sales.add(sale)
    // Add to outbox for syncing
    // await syncService.addToOutbox(
    //   'deposits',
    //   'create', // or 'create' based on your logic
    //   depot.id,
    //   depot,
    // )
    return saleId
  }

  return { count, insert }
}
