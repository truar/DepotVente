import { type CashRegisterControl, db } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useCashRegisterControlsDb() {
  async function insert(cashRegisterControl: CashRegisterControl) {
    const id = await db.cashRegisterControls.add(cashRegisterControl)
    // Add to outbox for syncing
    await syncService.addToOutbox(
      'cashRegisterControls',
      'create',
      id,
      cashRegisterControl,
    )
    return id
  }

  async function update(
    id: string,
    cashRegisterControl: Partial<CashRegisterControl>,
  ) {
    await db.cashRegisterControls.upsert(id, cashRegisterControl)
    // Add to outbox for syncing
    await syncService.addToOutbox(
      'cashRegisterControls',
      'update',
      id,
      cashRegisterControl,
    )
  }

  function findByCashRegisterIdAndType(cashRegisterId: number, type: string) {
    return db.cashRegisterControls.where({ cashRegisterId, type }).first()
  }

  return { insert, update, findByCashRegisterIdAndType }
}
