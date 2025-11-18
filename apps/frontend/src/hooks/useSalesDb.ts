import { db, type Deposit } from '@/db.ts'
import { useWorkstation } from './useWorkstation'
import { syncService } from '@/sync-service.ts'

export function useSalesDb() {
  const [workstation] = useWorkstation()

  function count() {
    if (!workstation) return Promise.resolve(0)
    return db.sales
      .where({ incrementStart: workstation?.incrementStart })
      .count()
  }

  return { count }
}
