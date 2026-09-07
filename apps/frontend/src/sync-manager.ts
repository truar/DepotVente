import SyncWorker from '@/workers/sync.worker?worker'

class SyncManager {
  private worker: Worker | null = null

  init() {
    if (this.worker) return

    this.worker = new SyncWorker()

    // Sync the auth token from localStorage to the worker
    const authStorage = localStorage.getItem('auth-storage')
    const token = authStorage ? JSON.parse(authStorage).state?.token : null

    this.worker.postMessage({ type: 'SET_TOKEN', payload: token })
    this.worker.postMessage({ type: 'START_SYNC' })

    this.worker.onmessage = (event) => {
      console.log('Worker message:', event.data)
    }
  }

  setToken(token: string | null) {
    this.worker?.postMessage({ type: 'SET_TOKEN', payload: token })
  }

  triggerInitialSync() {
    this.worker?.postMessage({ type: 'INITIAL_SYNC' })
  }

  triggerDeltaSync() {
    this.worker?.postMessage({ type: 'DELTA_SYNC' })
  }

  // Wipe the local copy (unsent writes included) and pull the server's.
  resetLocal() {
    this.worker?.postMessage({ type: 'RESET_LOCAL' })
  }
}

export const syncManager = new SyncManager()
