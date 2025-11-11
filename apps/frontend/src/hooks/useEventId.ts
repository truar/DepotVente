import { useLocalStorage } from '@/hooks/useLocalStorage.ts'
import type { Workstation } from '@/db.ts'

export function useEventId(): [
  string | undefined,
  (value: string | undefined) => void,
] {
  const [eventId, setEventId] = useLocalStorage<string | undefined>(
    'eventId',
    undefined,
  )
  return [eventId, setEventId]
}
