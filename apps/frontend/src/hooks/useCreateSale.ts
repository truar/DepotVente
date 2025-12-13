import { db } from '@/db.ts'
import { v4 } from 'uuid'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useContactsDb } from './useContactsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { useSalesDb } from '@/hooks/useSalesDb.ts'
import type { SaleFormType } from '@/types/saleForm.ts'

export function useCreateSale() {
  const [workstation] = useWorkstation()
  const salesDb = useSalesDb()
  const contactDb = useContactsDb()
  const articleDb = useArticlesDb()
  async function mutate(data: SaleFormType) {
    if (workstation === undefined) throw new Error('Workstation is undefined')
    await db.transaction(
      'rw',
      db.articles,
      db.sales,
      db.contacts,
      db.outbox,
      async () => {
        const currentDate = new Date()
        let contactId = data.contactId
        if (!contactId) {
          // Create contact
          contactId = await contactDb.insert({
            id: v4(),
            lastName: data.lastName,
            firstName: data.firstName,
            phoneNumber: data.phoneNumber,
            city: data.city,
            postalCode: null,
            createdAt: currentDate,
            updatedAt: currentDate,
            deletedAt: null,
          })
        } else {
          // Update contact
          await contactDb.update(contactId, {
            lastName: data.lastName,
            firstName: data.firstName,
            phoneNumber: data.phoneNumber,
            city: data.city,
            updatedAt: currentDate,
          })
        }

        const saleIndex = data.saleIndex
        const saleId = await salesDb.insert({
          id: v4(),
          saleIndex,
          buyerId: contactId,
          cardAmount: data.cardAmount,
          cashAmount: data.cashAmount,
          checkAmount: data.checkAmount,
          incrementStart: workstation.incrementStart,
          refundComment: undefined,
          refundCardAmount: undefined,
          refundCashAmount: undefined,
          createdAt: currentDate,
          updatedAt: currentDate,
          deletedAt: null,
        })

        await articleDb.batchUpdate(
          data.articles.map((articleForm) => ({
            key: articleForm.id,
            changes: {
              saleId: saleId,
              status: 'SOLD',
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
