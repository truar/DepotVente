import { db, type Deposit, type Workstation } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useDepositsDb() {
  function get(id: string) {
    return db.deposits.get(id)
  }

  function count(workstation: Workstation) {
    return db.deposits
      .where({ incrementStart: workstation.incrementStart })
      .count()
  }

  function findProfessionals() {
    return db.deposits.where({ type: 'PRO' }).sortBy('depositIndex')
  }

  async function insert(depot: Deposit) {
    const depotId = await db.deposits.add(depot)
    // Add to outbox for syncing
    await syncService.addToOutbox(
      'deposits',
      'create', // or 'create' based on your logic
      depot.id,
      depot,
    )
    return depotId
  }

  async function update(id: string, data: Partial<Deposit>) {
    await db.deposits.upsert(id, {
      ...data,
      updatedAt: new Date(),
    })
    // Add to outbox for syncing
    await syncService.addToOutbox('deposits', 'update', id, data)
  }

  return { get, insert, update, count, findProfessionals }
}
