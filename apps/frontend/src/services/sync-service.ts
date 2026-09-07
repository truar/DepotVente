import { v4 as uuid } from 'uuid'
import { liveQuery } from 'dexie'
import type { EpochMismatch, OutboxOperation } from '@/db.ts'
import { db } from '@/db.ts'
import { clientHeaders } from '@/services/client-identity.ts'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const MAX_RETRIES = 10
const BASE_DELAY = 1000 // 1 second
// How long to wait before re-trying a push refused for lack of a valid
// token. A fresh login re-kicks the queue immediately anyway (setToken).
const UNAUTHENTICATED_DELAY = 30_000

// Shape of every error body the backend sends (see plugins/error-handler.ts).
type ServerError = {
  code?: string
  message?: string
  serverEpoch?: string
}

// What happened to one outbox operation:
//   applied  - the server took it, removed from the outbox
//   rejected - the server refused it for good, parked for a human
//   retry    - transient failure, come back after `retryDelay`
//   blocked  - the whole queue must stop (server database reset)
type SyncOutcome =
  | { outcome: 'applied' | 'rejected' | 'blocked' }
  | { outcome: 'retry'; retryDelay: number }

// Outbox operations are pushed in the order they were written. Timestamps
// alone cannot express it: everything written in one Dexie transaction shares
// a millisecond, and a child (article) pushed before its parent (deposit) is
// refused by the server's foreign keys.
let lastSequence = 0
function nextSequence() {
  return ++lastSequence
}

export function compareOutboxOrder(a: OutboxOperation, b: OutboxOperation) {
  return a.timestamp - b.timestamp || (a.seq ?? 0) - (b.seq ?? 0)
}

const DATA_TABLES = [
  db.deposits,
  db.articles,
  db.contacts,
  db.sales,
  db.refunds,
  db.predeposits,
  db.predepositArticles,
  db.cashRegisterControls,
]

class SyncService {
  private isSyncing = false
  private syncInProgress = false
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    // Writes made while logged out are waiting for this.
    if (token) void this.processOutbox()
  }

  private getToken() {
    return this.token
  }

  /**
   * Start listening to outbox changes and sync automatically
   */
  startSync() {
    // Use Dexie's liveQuery to react to outbox changes
    liveQuery(() =>
      db.outbox
        .where('status')
        .equals('pending')
        .or('status')
        .equals('failed')
        .sortBy('timestamp'),
    ).subscribe({
      next: (operations) => {
        if (operations.length > 0 && !this.isSyncing) {
          this.processOutbox()
        }
      },
      error: (error) => {
        console.error('Error in outbox live query:', error)
      },
    })

    console.log('Sync service started - watching outbox for changes')
  }

  /**
   * Add an operation to the outbox
   */
  async addToOutbox(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    recordId: string,
    data: any,
  ): Promise<string> {
    const outboxOperation: OutboxOperation = {
      id: uuid(),
      timestamp: Date.now(),
      seq: nextSequence(),
      collection,
      operation,
      recordId,
      data,
      retryCount: 0,
      status: 'pending',
    }

    await db.outbox.add(outboxOperation)
    console.log(`Added operation ${outboxOperation.id} to outbox`)

    return outboxOperation.id
  }

  // ---------------------------------------------------------------------
  // HTTP plumbing
  // ---------------------------------------------------------------------

  /**
   * fetch() against the API with the auth token, the client identity headers
   * and the dataset epoch this computer synced against.
   */
  private async request(path: string, init: RequestInit = {}) {
    const headers: Record<string, string> = {
      ...(await clientHeaders()),
      ...(init.headers as Record<string, string> | undefined),
    }
    const token = this.getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    const epoch = await this.getMetadata('datasetEpoch')
    if (typeof epoch === 'string') headers['X-Dataset-Epoch'] = epoch

    return fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  }

  private async readError(response: Response): Promise<ServerError> {
    try {
      const body = await response.json()
      return body && typeof body === 'object' ? (body as ServerError) : {}
    } catch {
      return {}
    }
  }

  // ---------------------------------------------------------------------
  // Dataset epoch
  // ---------------------------------------------------------------------

  /**
   * The epoch header is mandatory on push and delta. A computer that has
   * never stored one (first run, or a build older than the epoch feature)
   * adopts whatever the server currently reports.
   */
  private async ensureEpoch(): Promise<string | null> {
    const stored = await this.getMetadata('datasetEpoch')
    if (typeof stored === 'string') return stored

    try {
      const response = await this.request('/sync/ping')
      if (!response.ok) return null
      const { datasetEpoch } = await response.json()
      if (typeof datasetEpoch !== 'string') return null
      await this.adoptEpoch(datasetEpoch)
      return datasetEpoch
    } catch (error) {
      console.error('Could not fetch dataset epoch:', error)
      return null
    }
  }

  /**
   * Record the epoch we are now synced against. Moving from one epoch to
   * another means the server database was rebuilt: every local write still
   * waiting in the outbox refers to records the server no longer knows, so
   * they are dropped rather than pushed into the new dataset.
   */
  private async adoptEpoch(serverEpoch: string) {
    const previous = await this.getMetadata('datasetEpoch')
    if (previous === serverEpoch) return

    if (typeof previous === 'string') {
      const dropped = await db.outbox.count()
      await db.outbox.clear()
      console.warn(
        `Dataset epoch changed (${previous} -> ${serverEpoch}), ${dropped} outbox operation(s) dropped`,
      )
    }
    await this.setMetadata('datasetEpoch', serverEpoch)
    await db.syncMetadata.delete('epochMismatch')
  }

  private async flagEpochMismatch(serverEpoch: string | undefined) {
    const localEpoch = await this.getMetadata('datasetEpoch')
    const mismatch: EpochMismatch = {
      serverEpoch: serverEpoch ?? 'inconnu',
      localEpoch: typeof localEpoch === 'string' ? localEpoch : null,
      detectedAt: Date.now(),
    }
    await this.setMetadata('epochMismatch', mismatch)
    console.error(
      '❌ The server database was reset since this computer last synced; sync is paused until the local base is rebuilt',
      mismatch,
    )
  }

  private async hasEpochMismatch() {
    return (await this.getMetadata('epochMismatch')) !== undefined
  }

  // ---------------------------------------------------------------------
  // Pull
  // ---------------------------------------------------------------------

  // Initial full sync
  async initialSync() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress')
      return
    }

    this.syncInProgress = true
    console.log(' Starting initial sync...')
    try {
      const response = await this.request('/sync/initial')

      if (!response.ok) {
        const error = await this.readError(response)
        throw new Error(
          `Sync failed: ${error.message ?? response.statusText} (HTTP ${response.status})`,
        )
      }

      const data = await response.json()

      // Bulk update IndexedDB
      await db.transaction('rw', DATA_TABLES, async () => {
        await db.deposits.clear()
        await db.deposits.bulkPut(data.deposits)

        await db.articles.clear()
        await db.articles.bulkPut(data.articles)

        await db.contacts.clear()
        await db.contacts.bulkPut(data.contacts)

        await db.sales.clear()
        await db.sales.bulkPut(data.sales)

        await db.refunds.clear()
        await db.refunds.bulkPut(data.refunds ?? [])

        await db.predeposits.clear()
        await db.predeposits.bulkPut(data.predeposits)

        await db.predepositArticles.clear()
        await db.predepositArticles.bulkPut(data.predepositArticles)

        await db.cashRegisterControls.clear()
        await db.cashRegisterControls.bulkPut(data.cashRegisterControls)
      })

      if (typeof data.datasetEpoch === 'string') {
        await this.adoptEpoch(data.datasetEpoch)
      }
      await this.setMetadata('lastSync', data.syncedAt)

      console.log('✅ Initial sync complete')
    } catch (error) {
      console.error('❌ Initial sync failed:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Forget everything this computer knows about the dataset (records,
   * unsent writes, sync cursor, epoch) and pull a fresh copy. The answer to
   * an EPOCH_MISMATCH. Workstation settings (cash register number, device
   * id) are kept.
   */
  async resetLocal() {
    const dropped = await db.outbox.count()
    await db.transaction(
      'rw',
      [...DATA_TABLES, db.outbox, db.syncMetadata],
      async () => {
        for (const table of DATA_TABLES) await table.clear()
        await db.outbox.clear()
        await db.syncMetadata.clear()
      },
    )
    console.warn(
      `Local base reset, ${dropped} unsent operation(s) dropped; pulling from server`,
    )
    await this.initialSync()
  }

  // Initial full sync
  async softInitialSync() {
    const lastSync = await this.getMetadata('lastSync')
    if (lastSync) {
      console.log(
        'Skipping initial sync - already synced at',
        new Date(lastSync).toLocaleString(),
      )
      return
    }

    await this.initialSync()
  }

  // Delta sync (fetch changes since last sync)
  async deltaSync() {
    if (await this.hasEpochMismatch()) {
      console.warn('Delta sync skipped: local base must be reset first')
      return
    }

    const lastSync = await this.getMetadata('lastSync')

    if (!lastSync) {
      return this.initialSync()
    }

    if (!(await this.ensureEpoch())) {
      console.warn('Delta sync skipped: dataset epoch unavailable')
      return
    }

    try {
      const response = await this.request(`/sync/delta?since=${lastSync}`)

      if (!response.ok) {
        const error = await this.readError(response)
        if (error.code === 'EPOCH_MISMATCH') {
          await this.flagEpochMismatch(error.serverEpoch)
          return
        }
        throw new Error(
          `Delta sync failed: ${error.message ?? response.statusText} (HTTP ${response.status})`,
        )
      }

      const data = await response.json()

      // Apply delta changes
      await db.transaction('rw', DATA_TABLES, async () => {
        if (data.deposits.length > 0) await db.deposits.bulkPut(data.deposits)
        if (data.articles.length > 0) await db.articles.bulkPut(data.articles)
        if (data.contacts.length > 0) await db.contacts.bulkPut(data.contacts)
        if (data.sales.length > 0) await db.sales.bulkPut(data.sales)
        if (data.refunds && data.refunds.length > 0)
          await db.refunds.bulkPut(data.refunds)
        if (data.predeposits.length > 0)
          await db.predeposits.bulkPut(data.predeposits)
        if (data.predepositArticles.length > 0)
          await db.predepositArticles.bulkPut(data.predepositArticles)
        if (data.cashRegisterControls.length > 0)
          await db.cashRegisterControls.bulkPut(data.cashRegisterControls)
      })

      await this.setMetadata('lastSync', data.syncedAt)

      console.log(
        `✅ Delta sync complete: ${data.deposits.length + data.articles.length + data.contacts.length + data.sales.length + (data.refunds?.length ?? 0) + data.predeposits.length + data.predepositArticles.length + data.cashRegisterControls.length} changes`,
      )
    } catch (error) {
      console.error('❌ Delta sync failed:', error)
    }
  }

  // Get sync metadata
  private async getMetadata(key: string): Promise<any> {
    const meta = await db.syncMetadata.get(key)
    return meta?.value
  }

  // Set sync metadata
  private async setMetadata(key: string, value: any) {
    await db.syncMetadata.put({ key, value })
  }

  // ---------------------------------------------------------------------
  // Push
  // ---------------------------------------------------------------------

  /**
   * Process all pending operations in the outbox
   */
  async processOutbox() {
    if (this.isSyncing) {
      return
    }

    this.isSyncing = true

    try {
      if (await this.hasEpochMismatch()) {
        console.warn('Outbox paused: local base must be reset first')
        return
      }
      if (!this.getToken()) {
        console.warn('Outbox paused: not authenticated')
        return
      }
      if (!(await this.ensureEpoch())) {
        console.warn('Outbox paused: dataset epoch unavailable')
        return
      }

      const pendingOps = (
        await db.outbox.where('status').anyOf('pending', 'failed').toArray()
      ).sort(compareOutboxOrder)

      for (const op of pendingOps) {
        const result = await this.syncOperation(op)

        if (result.outcome === 'retry') {
          // Strict FIFO: wait for this one before sending the next ones
          setTimeout(() => {
            this.processOutbox()
          }, result.retryDelay)
          break
        }
        if (result.outcome === 'blocked') {
          break
        }
        // 'applied' and 'rejected' both move on to the next operation
      }
    } catch (error) {
      console.error('Error processing outbox:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync a single operation to the server.
   */
  private async syncOperation(op: OutboxOperation): Promise<SyncOutcome> {
    // Check if we should retry based on exponential backoff
    if (op.lastAttempt) {
      const backoffDelay = this.calculateBackoff(op.retryCount)
      const timeSinceLastAttempt = Date.now() - op.lastAttempt

      if (timeSinceLastAttempt < backoffDelay) {
        return {
          outcome: 'retry',
          retryDelay: backoffDelay - timeSinceLastAttempt,
        }
      }
    }

    // Check max retries
    if (op.retryCount >= MAX_RETRIES) {
      console.error(`Operation ${op.id} exceeded max retries`)
      await db.outbox.update(op.id, {
        status: 'rejected',
        errorCode: 'MAX_RETRIES',
        error: `Abandon après ${op.retryCount} tentatives: ${op.error ?? 'erreur inconnue'}`,
      })
      return { outcome: 'rejected' }
    }

    // Update status to syncing
    await db.outbox.update(op.id, {
      status: 'syncing',
      lastAttempt: Date.now(),
    })

    try {
      const response = await this.request('/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId: op.id,
          collection: op.collection,
          operation: op.operation,
          recordId: op.recordId,
          data: op.data,
          timestamp: op.timestamp,
        }),
      })

      if (response.ok) {
        // Success - remove from outbox
        await db.outbox.delete(op.id)
        console.log(`✓ Successfully synced operation ${op.id}`)
        return { outcome: 'applied' }
      }

      const error = await this.readError(response)

      if (response.status === 401) {
        // Token missing or stale: not this operation's fault, and no amount
        // of backoff fixes it. Wait for a login.
        await db.outbox.update(op.id, {
          status: 'failed',
          error: 'Non authentifié',
          httpStatus: 401,
        })
        return { outcome: 'retry', retryDelay: UNAUTHENTICATED_DELAY }
      }

      if (error.code === 'EPOCH_MISMATCH') {
        await db.outbox.update(op.id, { status: 'pending' })
        await this.flagEpochMismatch(error.serverEpoch)
        return { outcome: 'blocked' }
      }

      if (response.status < 500) {
        // The server understood the request and refuses it: sending the same
        // bytes again cannot succeed. Park it and carry on with the queue.
        const message = error.message ?? response.statusText
        console.error(
          `✗ Operation ${op.id} rejected by server (${error.code ?? response.status}): ${message}`,
        )
        await db.outbox.update(op.id, {
          status: 'rejected',
          error: message,
          errorCode: error.code ?? `HTTP_${response.status}`,
          httpStatus: response.status,
        })
        return { outcome: 'rejected' }
      }

      throw new Error(
        `HTTP ${response.status}: ${error.message ?? response.statusText}`,
      )
    } catch (error) {
      // Network down, server down, database down: retry with backoff
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.error(`✗ Failed to sync operation ${op.id}:`, errorMessage)

      const newRetryCount = op.retryCount + 1
      await db.outbox.update(op.id, {
        status: 'failed',
        retryCount: newRetryCount,
        error: errorMessage,
      })

      return {
        outcome: 'retry',
        retryDelay: this.calculateBackoff(newRetryCount),
      }
    }
  }

  /**
   * Manually retry a single outbox operation, bypassing backoff and the
   * max-retries cutoff. Resets retry bookkeeping and re-kicks the queue.
   */
  async retry(operationId: string) {
    await db.outbox.update(operationId, {
      status: 'pending',
      retryCount: 0,
      lastAttempt: undefined,
      error: undefined,
      errorCode: undefined,
      httpStatus: undefined,
    })
    await this.processOutbox()
  }

  private calculateBackoff(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, ... up to ~17 minutes
    const delay = BASE_DELAY * Math.pow(2, retryCount)
    const maxDelay = 1000 * 60 * 17 // Max 17 minutes
    return Math.min(delay, maxDelay)
  }
}

export const syncService = new SyncService()
