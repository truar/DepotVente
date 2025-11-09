import { db, type Depot } from '@/db.ts'
import { useWorkstation } from './useWorkstation'

export function useDepotDb() {
  const [workstation] = useWorkstation()

  function count() {
    return db.depots.where({ workstation }).count()
  }

  function upsert(depot: Depot) {
    return db.depots.put(depot)
  }
  return { upsert, count }
}
