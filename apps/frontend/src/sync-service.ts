import { db, type OutboxOperation } from '@/db'
import { v4 as uuid } from 'uuid'
import { liveQuery } from 'dexie'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const MAX_RETRIES = 10
const BASE_DELAY = 1000 // 1 second

function getToken() {
  const authStorage = localStorage.getItem('auth-storage')
  return authStorage ? JSON.parse(authStorage).state?.token : null
}

class SyncService {
  private isSyncing = false
  private syncInProgress = false
  private retryTimeouts = new Map<string, NodeJS.Timeout>()

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

  // Initial full sync
  async initialSync() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress')
      return
    }

    this.syncInProgress = true
    console.log(' Starting initial sync...')
    const token = getToken()
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sync/initial`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Bulk update IndexedDB
      await db.transaction(
        'rw',
        [db.deposits, db.articles, db.contacts, db.sales],
        async () => {
          await db.deposits.clear()
          await db.deposits.bulkPut(data.deposits)

          await db.articles.clear()
          await db.articles.bulkPut(data.articles)

          await db.contacts.clear()
          await db.contacts.bulkPut(data.contacts)

          await db.sales.clear()
          await db.sales.bulkPut(data.sales)
        },
      )

      await this.setMetadata('lastSync', data.syncedAt)

      console.log('✅ Initial sync complete')
    } catch (error) {
      console.error('❌ Initial sync failed:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
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
    const lastSync = await this.getMetadata('lastSync')

    if (!lastSync) {
      return this.initialSync()
    }
    const token = getToken()

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sync/delta?since=${lastSync}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Delta sync failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Apply delta changes
      await db.transaction(
        'rw',
        [db.deposits, db.articles, db.contacts, db.sales],
        async () => {
          if (data.deposits.length > 0) await db.deposits.bulkPut(data.deposits)
          if (data.articles.length > 0) await db.articles.bulkPut(data.articles)
          if (data.contacts.length > 0) await db.contacts.bulkPut(data.contacts)
          if (data.sales.length > 0) await db.sales.bulkPut(data.sales)
        },
      )

      await this.setMetadata('lastSync', data.syncedAt)

      console.log(
        `✅ Delta sync complete: ${data.deposits.length + data.articles.length + data.contacts.length + data.sales.length} changes`,
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

  /**
   * Process all pending operations in the outbox
   */
  async processOutbox() {
    if (this.isSyncing) {
      return
    }

    this.isSyncing = true

    try {
      const pendingOps = await db.outbox
        .where('status')
        .anyOf('pending', 'failed')
        .sortBy('timestamp')

      for (const op of pendingOps) {
        await this.syncOperation(op)
      }
    } catch (error) {
      console.error('Error processing outbox:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync a single operation to the server
   */
  private async syncOperation(op: OutboxOperation) {
    // Check if we should retry based on exponential backoff
    if (op.lastAttempt) {
      const backoffDelay = this.calculateBackoff(op.retryCount)
      const timeSinceLastAttempt = Date.now() - op.lastAttempt

      if (timeSinceLastAttempt < backoffDelay) {
        // Schedule retry for later
        this.scheduleRetry(op, backoffDelay - timeSinceLastAttempt)
        return
      }
    }

    // Check max retries
    if (op.retryCount >= MAX_RETRIES) {
      console.error(`Operation ${op.id} exceeded max retries`)
      await db.outbox.update(op.id, {
        status: 'failed',
        error: 'Max retries exceeded',
      })
      return
    }

    // Update status to syncing
    await db.outbox.update(op.id, {
      status: 'syncing',
      lastAttempt: Date.now(),
    })

    try {
      // Get auth token
      const token = getToken()

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // Send to server
      const response = await fetch(`${API_BASE_URL}/push`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operationId: op.id,
          collection: op.collection,
          operation: op.operation,
          recordId: op.recordId,
          data: op.data,
          timestamp: op.timestamp,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Success - remove from outbox
      await db.outbox.delete(op.id)
      console.log(`✓ Successfully synced operation ${op.id}`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.error(`✗ Failed to sync operation ${op.id}:`, errorMessage)

      // Update with error and schedule retry
      const newRetryCount = op.retryCount + 1
      await db.outbox.update(op.id, {
        status: 'failed',
        retryCount: newRetryCount,
        error: errorMessage,
      })

      // Schedule retry with exponential backoff
      const backoffDelay = this.calculateBackoff(newRetryCount)
      this.scheduleRetry(op, backoffDelay)
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, ... up to ~17 minutes
    const delay = BASE_DELAY * Math.pow(2, retryCount)
    const maxDelay = 1000 * 60 * 17 // Max 17 minutes
    return Math.min(delay, maxDelay)
  }

  /**
   * Schedule a retry for a failed operation
   */
  private scheduleRetry(op: OutboxOperation, delay: number) {
    // Clear existing timeout if any
    const existingTimeout = this.retryTimeouts.get(op.id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    console.log(
      `Scheduling retry for ${op.id} in ${delay}ms (attempt ${op.retryCount + 1})`,
    )

    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(op.id)
      this.syncOperation(op)
    }, delay)

    this.retryTimeouts.set(op.id, timeout)
  }

  /**
   * Manually trigger a sync (useful for pull-to-refresh or retry buttons)
   */
  async manualSync() {
    await this.processOutbox()
  }

  /**
   * Clear all failed operations (useful for debugging or user action)
   */
  async clearFailedOperations() {
    const failed = await db.outbox.where('status').equals('failed').toArray()
    await db.outbox.bulkDelete(failed.map((op) => op.id))
    console.log(`Cleared ${failed.length} failed operations`)
  }

  /**
   * Get outbox statistics
   */
  async getStats() {
    const [pending, syncing, failed, total] = await Promise.all([
      db.outbox.where('status').equals('pending').count(),
      db.outbox.where('status').equals('syncing').count(),
      db.outbox.where('status').equals('failed').count(),
      db.outbox.count(),
    ])

    return { pending, syncing, failed, total }
  }
}

export const syncService = new SyncService()
