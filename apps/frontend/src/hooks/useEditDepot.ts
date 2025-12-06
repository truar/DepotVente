import { db } from '@/db.ts'
import { useDepotsDb } from '@/hooks/useDepotsDb.ts'
import { useContactsDb } from './useContactsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import type { EditDepositFormType } from '@/types/EditDepositForm.ts'

export function useEditDepot() {
  const depotDb = useDepotsDb()
  const contactDb = useContactsDb()
  const articleDb = useArticlesDb()
  async function mutate(data: EditDepositFormType['deposit']) {
    await db.transaction(
      'rw',
      db.articles,
      db.deposits,
      db.contacts,
      db.outbox,
      async () => {
        const currentDate = new Date()
        await contactDb.update(data.sellerId, {
          lastName: data.lastName,
          firstName: data.firstName,
          phoneNumber: data.phoneNumber,
          city: data.city,
          updatedAt: currentDate,
        })

        await depotDb.update(data.id, {
          contributionStatus: data.contributionStatus,
          contributionAmount: data.contributionAmount,
          updatedAt: currentDate,
        })

        await articleDb.batchUpdate(
          data.articles.map((articleForm) => ({
            key: articleForm.id,
            changes: {
              status: articleForm.status,
              price: articleForm.price,
              discipline: articleForm.discipline,
              brand: articleForm.brand,
              category: articleForm.type,
              size: articleForm.size,
              color: articleForm.color,
              model: articleForm.model,
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
