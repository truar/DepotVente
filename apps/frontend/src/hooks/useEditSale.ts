import { v4 } from 'uuid'
import { db } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useContactsDb } from './useContactsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { useSalesDb } from '@/hooks/useSalesDb.ts'
import { useRefundsDb } from '@/hooks/useRefundsDb.ts'
import type { EditSaleFormType } from '@/types/EditSaleForm.ts'

export function useEditSale() {
  const [workstation] = useWorkstation()
  const salesDb = useSalesDb()
  const contactDb = useContactsDb()
  const articleDb = useArticlesDb()
  const refundsDb = useRefundsDb()
  async function mutate(data: EditSaleFormType) {
    if (workstation === undefined) throw new Error('Workstation is undefined')
    await db.transaction(
      'rw',
      [db.articles, db.sales, db.contacts, db.refunds, db.outbox],
      async () => {
        const currentDate = new Date()
        await contactDb.update(data.buyer.contactId!, {
          lastName: data.buyer.lastName,
          firstName: data.buyer.firstName,
          phoneNumber: data.buyer.phoneNumber,
          city: data.buyer.city,
          updatedAt: currentDate,
        })

        const existingSale = await db.sales.get(data.id)
        const previousTotalRefund = existingSale?.totalRefundAmount ?? 0
        const newRefundDelta = data.articles
          .filter((a) => a.isDeleted)
          .reduce((sum, a) => sum + (a.price ?? 0), 0)

        await salesDb.update(data.id, {
          checkAmount: data.checkAmount,
          cashAmount: data.cashAmount,
          cardAmount: data.cardAmount,
          deferredAmount: data.deferredAmount,
          totalRefundAmount: previousTotalRefund + newRefundDelta,
          updatedAt: currentDate,
        })

        const refundCardAmount = data.refundCardAmount ?? 0
        const refundCashAmount = data.refundCashAmount ?? 0
        const refundTotal = refundCardAmount + refundCashAmount
        const existingRefund = await refundsDb.getBySaleId(data.id)
        const isExistingActive =
          existingRefund != null && existingRefund.deletedAt == null

        if (refundTotal === 0) {
          if (isExistingActive) {
            await refundsDb.update(existingRefund.id, {
              deletedAt: currentDate,
              updatedAt: currentDate,
            })
          }
        } else if (isExistingActive) {
          // Pin-once: keep the existing incrementStart, only update amounts.
          await refundsDb.update(existingRefund.id, {
            cardAmount: refundCardAmount,
            cashAmount: refundCashAmount,
            comment: data.refundComment ?? '',
            updatedAt: currentDate,
          })
        } else if (existingRefund) {
          // Soft-deleted row exists; resurrect it, pinned to the current caisse.
          await refundsDb.update(existingRefund.id, {
            incrementStart: workstation.incrementStart,
            cardAmount: refundCardAmount,
            cashAmount: refundCashAmount,
            comment: data.refundComment ?? '',
            deletedAt: null,
            updatedAt: currentDate,
          })
        } else {
          await refundsDb.insert({
            id: v4(),
            saleId: data.id,
            incrementStart: workstation.incrementStart,
            cardAmount: refundCardAmount,
            cashAmount: refundCashAmount,
            comment: data.refundComment ?? '',
            createdAt: currentDate,
            updatedAt: currentDate,
            deletedAt: null,
          })
        }

        await articleDb.batchUpdate(
          data.articles.map((articleForm) => ({
            key: articleForm.id,
            changes: {
              saleId: articleForm.isDeleted ? null : data.id,
              status: articleForm.isDeleted ? 'RECEPTION_OK' : 'SOLD',
              updatedAt: currentDate,
            },
          })),
        )
      },
    )
  }

  return {
    mutate,
  }
}
