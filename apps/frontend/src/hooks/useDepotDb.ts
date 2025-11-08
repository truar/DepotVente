import { db } from '@/db.ts'
import { useWorkstation } from './useWorkstation'

export function useDepotDb() {
  const [workstation] = useWorkstation()

  async function getCount() {
    return db.depots.where({ workstation }).count()
  }
  return { getCount }
}
