import { db } from '@/db.ts'
import { useWorkstation } from './useWorkstation'
import { useLiveQuery } from 'dexie-react-hooks'

export function useDepotDb() {
  const [workstation] = useWorkstation()

  function getCount() {
    return useLiveQuery(() => db.depots.where({ workstation }).count())
  }
  return { getCount }
}
