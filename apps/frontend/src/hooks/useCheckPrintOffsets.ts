import { db } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
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
  const stored = (record?.value ?? {}) as Partial<CheckPrintOffsets>
  const offsets: CheckPrintOffsets = {
    ...DEFAULT_CHECK_PRINT_OFFSETS,
    ...stored,
  }
  const setOffsets = useCallback((value: CheckPrintOffsets) => {
    db.workstation.put({ key: STORAGE_KEY, value })
  }, [])
  return [offsets, setOffsets]
}
