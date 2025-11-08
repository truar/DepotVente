import { useLocalStorage } from '@/hooks/useLocalStorage.ts'

export function useWorkstation(): [number, (value: number) => void] {
  const [workstation, setWorkstation] = useLocalStorage<number>(
    'workstation',
    0,
  )
  return [workstation ?? 0, setWorkstation]
}
