import { db, type Refund } from '@/db.ts'
import { syncService } from '@/services/sync-service.ts'

export function useRefundsDb() {
  function getBySaleId(saleId: string) {
    return db.refunds.where({ saleId }).first()
  }

  async function insert(refund: Refund) {
    const refundId = await db.refunds.add(refund)
    await syncService.addToOutbox('refunds', 'create', refundId, refund)
    return refundId
  }

  async function update(id: string, data: Partial<Refund>) {
    await db.refunds.upsert(id, data)
    await syncService.addToOutbox('refunds', 'update', id, data)
  }

  return { getBySaleId, insert, update }
}
