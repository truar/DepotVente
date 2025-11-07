import { useLocalStorage } from '@/hooks/useLocalStorage.ts'

export function useWorkstation() {
  return useLocalStorage<string>('workstation', '')
}
