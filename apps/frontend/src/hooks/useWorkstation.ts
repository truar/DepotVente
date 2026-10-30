import { db, type Deposit, type Workstation } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'

export function useWorkstation(): [
  Workstation,
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

// Comme dans l'ancien logiciel, la caisse 1 est celle des pros : leurs fiches
// importées y sont, et une fiche saisie sur cette caisse est un dépôt PRO.
export const PRO_WORKSTATION = 1

export function depositTypeOf(workstation: Workstation): Deposit['type'] {
  return workstation.incrementStart === PRO_WORKSTATION ? 'PRO' : 'PARTICULIER'
}
