import { db } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useContactsDb } from './useContactsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { useSalesDb } from '@/hooks/useSalesDb.ts'
import type { EditSaleFormType } from '@/types/EditSaleForm.ts'

export function useEditSale() {
  const [workstation] = useWorkstation()
  const salesDb = useSalesDb()
  const contactDb = useContactsDb()
  const articleDb = useArticlesDb()
  async function mutate(data: EditSaleFormType) {
    if (workstation === undefined) throw new Error('Workstation is undefined')
    await db.transaction(
      'rw',
      db.articles,
      db.sales,
      db.contacts,
      db.outbox,
      async () => {
        const currentDate = new Date()
        await contactDb.update(data.contactId, {
          lastName: data.lastName,
          firstName: data.firstName,
          phoneNumber: data.phoneNumber,
          city: data.city,
          updatedAt: currentDate,
        })

        await salesDb.update(data.id, {
          checkAmount: data.checkAmount,
          cashAmount: data.cashAmount,
          cardAmount: data.cardAmount,
          refundCardAmount: data.refundCardAmount,
          refundCashAmount: data.refundCashAmount,
          refundComment: data.refundComment,
          updatedAt: currentDate,
        })

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
