import { db, type Deposit, type Workstation } from '@/db.ts'
import { syncService } from '@/services/sync-service.ts'

export function useDepositsDb() {
  function get(id: string) {
    return db.deposits.get(id)
  }

  // Le numéro de la prochaine fiche : le plus grand de la caisse + 1, et non
  // son nombre de fiches + 1 qui, passé un trou dans les numéros, en
  // redonnait un déjà pris. Une fiche supprimée garde le sien.
  async function nextIndex(workstation: Workstation) {
    const deposits = await db.deposits
      .where({ incrementStart: workstation.incrementStart })
      .toArray()
    return (
      deposits.reduce(
        (max, deposit) => Math.max(max, deposit.depositIndex),
        workstation.incrementStart,
      ) + 1
    )
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

  return { get, insert, update, nextIndex, findProfessionals }
}
