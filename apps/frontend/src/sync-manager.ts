import type { ResetResult } from '@/services/sync-service.ts'
import SyncWorker from '@/workers/sync.worker?worker'

class SyncManager {
  private worker: Worker | null = null
  // Rechargements demandés au worker, en attente de sa réponse.
  private pendingResets: Array<(result: ResetResult) => void> = []

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
      if (event.data?.type === 'RESET_LOCAL_DONE') {
        const result = event.data.result as ResetResult
        for (const resolve of this.pendingResets.splice(0)) resolve(result)
      }
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

  // Remplace la copie locale (écritures non envoyées comprises) par celle du
  // serveur. Si le serveur ne la fournit pas, la copie locale reste intacte
  // et le résultat dit pourquoi.
  resetLocal(): Promise<ResetResult> {
    const worker = this.worker
    if (!worker) {
      return Promise.resolve({
        ok: false,
        unreachable: false,
        message: 'Synchronisation non démarrée',
      })
    }
    return new Promise((resolve) => {
      this.pendingResets.push(resolve)
      worker.postMessage({ type: 'RESET_LOCAL' })
    })
  }
}

export const syncManager = new SyncManager()
