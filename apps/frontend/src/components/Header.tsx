import { useSyncStatus } from '@/hooks/useSyncStatus.ts'

export default function Header() {
  useSyncStatus()
  return null
}
