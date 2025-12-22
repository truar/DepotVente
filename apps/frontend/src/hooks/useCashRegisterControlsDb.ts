import { type CashRegisterControl, db } from '@/db.ts'

export function useCashRegisterControlsDb() {
  async function insert(cashRegisterControl: CashRegisterControl) {
    const id = await db.cashRegisterControls.add(cashRegisterControl)
    // Add to outbox for syncing
    // await syncService.addToOutbox('cashRegisterControls', 'create', id, cashRegisterControl)
    return id
  }

  async function update(
    id: string,
    cashRegisterControl: Partial<CashRegisterControl>,
  ) {
    await db.cashRegisterControls.upsert(id, cashRegisterControl)
    // Add to outbox for syncing
    // await syncService.addToOutbox('cashRegisterControls', 'update', id, cashRegisterControl)
  }

  function findByCashRegisterIdAndType(cashRegisterId: number, type: string) {
    // TODO check why the request { cashRegisterId, type } throws an error, even if the compoundIndex was created
    return db.cashRegisterControls
      .where({ cashRegisterId })
      .and((cashRegisterControl) => cashRegisterControl.type === type)
      .first()
  }

  return { insert, update, findByCashRegisterIdAndType }
}
