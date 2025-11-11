import { useLocalStorage } from '@/hooks/useLocalStorage.ts'
import type { Workstation } from '@/db.ts'

export function useWorkstation(): [
  Workstation | undefined,
  (value: Workstation | undefined) => void,
] {
  const [workstation, setWorkstation] = useLocalStorage<
    Workstation | undefined
  >('workstation', undefined)
  return [workstation, setWorkstation]
}
