import { db, type Refund } from '@/db.ts'
import { syncService } from '@/services/sync-service.ts'

export function useRefundsDb() {
  // Tous les remboursements encore actifs de la vente, du plus ancien au
  // plus récent : une vente peut être remboursée en plusieurs fois, sur
  // plusieurs caisses.
  function listBySaleId(saleId: string) {
    return db.refunds
      .where({ saleId })
      .filter((refund) => refund.deletedAt == null)
      .sortBy('createdAt')
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

  return { listBySaleId, insert, update }
}
