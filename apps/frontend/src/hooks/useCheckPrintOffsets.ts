import { useLiveQuery } from 'dexie-react-hooks'
import type { CheckPrintOffsets } from '@/pdf/seller-check.tsx'
import { db } from '@/db.ts'
import { DEFAULT_CHECK_PRINT_OFFSETS } from '@/pdf/seller-check.tsx'

const STORAGE_KEY = 'checkPrintOffsets'

// Les décalages validés sur ce poste, complétés par les valeurs par défaut
// pour ceux qui n'ont jamais été enregistrés. `undefined` tant que la base
// locale n'a pas répondu : on ne confond pas « en cours de lecture » avec
// « jamais validé ».
export function useStoredCheckPrintOffsets(): CheckPrintOffsets | undefined {
  return useLiveQuery(async () => {
    const record = await db.workstation.get(STORAGE_KEY)
    return {
      ...DEFAULT_CHECK_PRINT_OFFSETS,
      ...((record?.value ?? {}) as Partial<CheckPrintOffsets>),
    }
  })
}

export async function saveCheckPrintOffsets(
  value: CheckPrintOffsets,
): Promise<void> {
  await db.workstation.put({ key: STORAGE_KEY, value })
}

// Pour l'impression des vrais chèques : les décalages validés (les valeurs
// par défaut le temps que la base locale réponde).
export function useCheckPrintOffsets(): [
  CheckPrintOffsets,
  (value: CheckPrintOffsets) => Promise<void>,
] {
  return [
    useStoredCheckPrintOffsets() ?? DEFAULT_CHECK_PRINT_OFFSETS,
    saveCheckPrintOffsets,
  ]
}
