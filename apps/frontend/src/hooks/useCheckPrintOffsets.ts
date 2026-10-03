import { db } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import {
  type CheckPrintOffsets,
  DEFAULT_CHECK_PRINT_OFFSETS,
} from '@/pdf/seller-check.tsx'

const STORAGE_KEY = 'checkPrintOffsets'

export function useCheckPrintOffsets(): [
  CheckPrintOffsets,
  (value: CheckPrintOffsets) => void,
] {
  const record = useLiveQuery(() => db.workstation.get(STORAGE_KEY))
  // Mémoïsé sur l'enregistrement lu : l'écran recopie ces valeurs dans son
  // état local dès qu'elles changent, un nouvel objet à chaque rendu le ferait
  // boucler sans fin.
  const offsets = useMemo<CheckPrintOffsets>(
    () => ({
      ...DEFAULT_CHECK_PRINT_OFFSETS,
      ...((record?.value ?? {}) as Partial<CheckPrintOffsets>),
    }),
    [record],
  )
  const setOffsets = useCallback((value: CheckPrintOffsets) => {
    db.workstation.put({ key: STORAGE_KEY, value })
  }, [])
  return [offsets, setOffsets]
}
