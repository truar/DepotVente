import { useCashRegisterControlsDb } from '@/hooks/useCashRegisterControlsDb.ts'
import type { CashRegisterControlFormType } from '@/types/SaveDepositCashRegisterControlForm.ts'
import { v4 } from 'uuid'
import type { CashRegisterControl } from '@/db.ts'

const getAmount = (
  amounts: CashRegisterControlFormType['amounts'],
  value: number,
) => amounts.find((a) => a.value === value)?.amount ?? 0

const toCashRegisterControl = (
  data: CashRegisterControlFormType,
): Omit<
  CashRegisterControl,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'type'
> => ({
  cashRegisterId: data.cashRegisterId,
  initialAmount: data.initialAmount,
  theoreticalCashAmount: data.theoreticalAmount,
  realCashAmount: data.realAmount,
  difference: data.realAmount - data.theoreticalAmount,
  totalAmount: data.realAmount + data.initialAmount,
  cash200: getAmount(data.amounts, 200),
  cash100: getAmount(data.amounts, 100),
  cash50: getAmount(data.amounts, 50),
  cash20: getAmount(data.amounts, 20),
  cash10: getAmount(data.amounts, 10),
  cash5: getAmount(data.amounts, 5),
  cash2: getAmount(data.amounts, 2),
  cash1: getAmount(data.amounts, 1),
  cash05: getAmount(data.amounts, 0.5),
  cash02: getAmount(data.amounts, 0.2),
  cash01: getAmount(data.amounts, 0.1),
  cash005: getAmount(data.amounts, 0.05),
  cash002: getAmount(data.amounts, 0.02),
  cash001: getAmount(data.amounts, 0.01),
})

export function useSaveCashRegisterControlMutation(
  type: CashRegisterControl['type'],
) {
  const cashRegisterControlsDb = useCashRegisterControlsDb()
  const mutate = async (data: CashRegisterControlFormType) => {
    const id = data.id
    const date = new Date()
    if (!id) {
      await cashRegisterControlsDb.insert({
        id: v4(),
        ...toCashRegisterControl(data),
        type,
        createdAt: date,
        updatedAt: date,
        deletedAt: null,
      })
    } else {
      await cashRegisterControlsDb.update(id, {
        ...toCashRegisterControl(data),
        type: type,
        updatedAt: date,
      })
    }
  }
  return { mutate }
}
