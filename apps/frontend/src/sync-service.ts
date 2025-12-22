import { db, type OutboxOperation } from '@/db'
import { v4 as uuid } from 'uuid'
import { liveQuery } from 'dexie'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const MAX_RETRIES = 10
const BASE_DELAY = 1000 // 1 second

class SyncService {
  private isSyncing = false
  private syncInProgress = false
  private retryTimeout: NodeJS.Timeout | null = null
  private token: string | null = null

  setToken(token: string) {
    this.token = token
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
    const token = this.getToken()
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
        [
          db.deposits,
          db.articles,
          db.contacts,
          db.sales,
          db.predeposits,
          db.predepositArticles,
          db.cashRegisterControls,
        ],
        async () => {
          await db.deposits.clear()
          await db.deposits.bulkPut(data.deposits)

          await db.articles.clear()
          await db.articles.bulkPut(data.articles)

          await db.contacts.clear()
          await db.contacts.bulkPut(data.contacts)

          await db.sales.clear()
          await db.sales.bulkPut(data.sales)

          await db.predeposits.clear()
          await db.predeposits.bulkPut(data.predeposits)

          await db.predepositArticles.clear()
          await db.predepositArticles.bulkPut(data.predepositArticles)

          await db.cashRegisterControls.clear()
          await db.cashRegisterControls.bulkPut(data.cashRegisterControls)
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

    const token = this.getToken()
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
        [
          db.deposits,
          db.articles,
          db.contacts,
          db.sales,
          db.predeposits,
          db.predepositArticles,
          db.cashRegisterControls,
        ],
        async () => {
          if (data.deposits.length > 0) await db.deposits.bulkPut(data.deposits)
          if (data.articles.length > 0) await db.articles.bulkPut(data.articles)
          if (data.contacts.length > 0) await db.contacts.bulkPut(data.contacts)
          if (data.sales.length > 0) await db.sales.bulkPut(data.sales)
          if (data.predeposits.length > 0)
            await db.predeposits.bulkPut(data.predeposits)
          if (data.predepositArticles.length > 0)
            await db.predepositArticles.bulkPut(data.predepositArticles)
          if (data.cashRegisterControls.length > 0)
            await db.cashRegisterControls.bulkPut(data.cashRegisterControls)
        },
      )

      await this.setMetadata('lastSync', data.syncedAt)

      console.log(
        `✅ Delta sync complete: ${data.deposits.length + data.articles.length + data.contacts.length + data.sales.length + data.predeposits.length + data.predepositArticles.length + data.cashRegisterControls.length} changes`,
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
        const result = await this.syncOperation(op)

        if (!result.success) {
          // Schedule a retry for the outbox based on the needed delay
          if (result.retryDelay !== undefined) {
            this.retryTimeout = setTimeout(() => {
              this.processOutbox()
            }, result.retryDelay)
          }
          break
        }
      }
    } catch (error) {
      console.error('Error processing outbox:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync a single operation to the server. Returns status and potential retry delay.
   */
  private async syncOperation(
    op: OutboxOperation,
  ): Promise<{ success: boolean; retryDelay?: number }> {
    // Check if we should retry based on exponential backoff
    if (op.lastAttempt) {
      const backoffDelay = this.calculateBackoff(op.retryCount)
      const timeSinceLastAttempt = Date.now() - op.lastAttempt

      if (timeSinceLastAttempt < backoffDelay) {
        return {
          success: false,
          retryDelay: backoffDelay - timeSinceLastAttempt,
        }
      }
    }

    // Check max retries
    if (op.retryCount >= MAX_RETRIES) {
      console.error(`Operation ${op.id} exceeded max retries`)
      await db.outbox.update(op.id, {
        status: 'failed',
        error: 'Max retries exceeded',
      })
      // We return true here to "skip" this poisoned message and move to the next in FIFO
      // or false if you want to block the queue until manual intervention.
      // Usually, for FIFO strictly, we might want to block or alert.
      return { success: true }
    }

    // Update status to syncing
    await db.outbox.update(op.id, {
      status: 'syncing',
      lastAttempt: Date.now(),
    })

    try {
      // ... existing auth and fetch setup ...
      const token = this.getToken()
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

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
      return { success: true }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.error(`✗ Failed to sync operation ${op.id}:`, errorMessage)

      const newRetryCount = op.retryCount + 1
      await db.outbox.update(op.id, {
        status: 'failed',
        retryCount: newRetryCount,
        error: errorMessage,
      })

      const nextDelay = this.calculateBackoff(newRetryCount)
      return { success: false, retryDelay: nextDelay }
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
}

export const syncService = new SyncService()
