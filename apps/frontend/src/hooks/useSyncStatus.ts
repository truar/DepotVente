import { useEffect, useState } from 'react'
import { syncService } from '@/sync-service'
import { db } from '@/db'
import { useLiveQuery } from 'dexie-react-hooks'

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSync: number | null
  outboxCount: number
  sseConnected: boolean
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    outboxCount: 0,
    sseConnected: false,
  })

  // Get outbox count reactively
  const outboxCount = useLiveQuery(() => db.outbox.count(), [], 0)

  // Get last sync timestamp
  const lastSync = useLiveQuery(
    async () => {
      const meta = await db.syncMetadata.get('lastSync')
      return (meta?.value as number) || null
    },
    [],
    null,
  )

  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      outboxCount,
      lastSync,
    }))
  }, [outboxCount, lastSync])

  // Handle online/offline
  useEffect(() => {
    const handleOnline = async () => {
      setStatus((prev) => ({ ...prev, isOnline: true }))

      // Process pending changes
      await syncService.processOutbox()

      // Fetch delta changes
      await syncService.deltaSync()
    }

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Initial sync on mount
  useEffect(() => {
    console.log('Initial sync triggered')
    ;(async () => {
      setStatus((prev) => ({ ...prev, isSyncing: true }))
      try {
        await syncService.softInitialSync()
        // syncService.connectSSE(workstation.id, token)
        setStatus((prev) => ({ ...prev, sseConnected: true }))
      } catch (error) {
        console.error('Failed to initialize sync:', error)
      } finally {
        setStatus((prev) => ({ ...prev, isSyncing: false }))
      }
    })()

    return () => {
      // syncService.disconnectSSE()
    }
  }, [])

  // Periodic outbox processing
  useEffect(() => {
    if (!navigator.onLine) return

    const interval = setInterval(() => {
      syncService.deltaSync()
    }, 60000)

    return () => clearInterval(interval)
  }, [status.isOnline])

  return status
}
