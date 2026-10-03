import { syncService } from '@/services/sync-service.ts'

let syncInterval: NodeJS.Timeout | null = null
const DELTA_SYNC_INTERVAL = 20000

// Listen for messages from the main thread
self.onmessage = async (event) => {
  const { type, payload } = event.data
  console.log('receiving message', type)
  switch (type) {
    case 'SET_TOKEN':
      syncService.setToken(payload)
      break
    case 'INITIAL_SYNC':
      try {
        await syncService.initialSync()
        self.postMessage({ type: 'SYNC_COMPLETE' })
      } catch (error) {
        self.postMessage({ type: 'SYNC_ERROR', error: error })
      }
      break
    case 'START_SYNC':
      syncService.startSync()

      // Start the background interval for Delta Sync
      if (syncInterval) clearInterval(syncInterval)
      syncInterval = setInterval(async () => {
        try {
          await syncService.deltaSync()
        } catch {
          // Déjà journalisé par le service ; le tick suivant réessaiera.
        }
      }, DELTA_SYNC_INTERVAL)

      // Run once immediately
      try {
        await syncService.softInitialSync()
        await syncService.deltaSync()
      } catch {
        // Déjà journalisé par le service ; le prochain poll réessaiera.
      }
      break
    case 'STOP_SYNC':
      if (syncInterval) {
        clearInterval(syncInterval)
        syncInterval = null
      }
      break
    case 'PROCESS_OUTBOX':
      await syncService.processOutbox()
      break
    case 'RESET_LOCAL':
      // resetLocal ne lève pas : il dit si la base a été remplacée ou, sinon,
      // pourquoi (la base locale est alors intacte).
      self.postMessage({
        type: 'RESET_LOCAL_DONE',
        result: await syncService.resetLocal(),
      })
      break
  }
}
