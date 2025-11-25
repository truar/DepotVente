import { db, type Workstation } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'

export function useWorkstation(): [
  Workstation | undefined,
  (value: number | undefined) => void,
] {
  const workstation = useLiveQuery(() => db.workstation.get('incrementStart'))
  const setWorkstation = useCallback((value: unknown) => {
    db.workstation.put({ key: 'incrementStart', value })
  }, [])
  return [
    {
      incrementStart: (workstation?.value as number) ?? 0,
    },
    setWorkstation,
  ]
}
