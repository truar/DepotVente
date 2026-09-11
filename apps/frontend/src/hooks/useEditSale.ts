import { v4 } from 'uuid'
import { db } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useContactsDb } from './useContactsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { useSalesDb } from '@/hooks/useSalesDb.ts'
import { useRefundsDb } from '@/hooks/useRefundsDb.ts'
import type { EditSaleFormType } from '@/types/EditSaleForm.ts'
import { refundLineTotal } from '@/types/EditSaleForm.ts'

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

        // Chaque ligne appartient à la caisse qui a sorti l'argent : une
        // ligne déjà enregistrée garde la sienne, quelle que soit la caisse
        // qui la corrige ; la ligne saisie ici est apposée à celle du poste.
        for (const line of data.refunds) {
          const cardAmount = line.cardAmount ?? 0
          const cashAmount = line.cashAmount ?? 0
          const comment = line.comment ?? ''
          if (line.id == null) {
            if (refundLineTotal(line) === 0) continue
            await refundsDb.insert({
              id: v4(),
              saleId: data.id,
              incrementStart: workstation.incrementStart,
              cardAmount,
              cashAmount,
              comment,
              createdAt: currentDate,
              updatedAt: currentDate,
              deletedAt: null,
            })
            continue
          }
          const existing = await db.refunds.get(line.id)
          if (!existing) continue
          if (refundLineTotal(line) === 0) {
            await refundsDb.update(line.id, {
              deletedAt: currentDate,
              updatedAt: currentDate,
            })
            continue
          }
          // Rien de changé sur cette ligne : ne pas la repousser au serveur.
          if (
            existing.cardAmount === cardAmount &&
            existing.cashAmount === cashAmount &&
            existing.comment === comment
          ) {
            continue
          }
          await refundsDb.update(line.id, {
            cardAmount,
            cashAmount,
            comment,
            updatedAt: currentDate,
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
