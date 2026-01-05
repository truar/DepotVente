import { db } from '@/db.ts'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { useContactsDb } from './useContactsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'

export function useEditDepot() {
  const depotDb = useDepositsDb()
  const contactDb = useContactsDb()
  const articleDb = useArticlesDb()
  async function mutate(data: DepositFormType['deposit']) {
    await db.transaction(
      'rw',
      db.articles,
      db.deposits,
      db.contacts,
      db.outbox,
      async () => {
        const currentDate = new Date()
        if (data.sellerId) {
          await contactDb.update(data.sellerId, {
            lastName: data.lastName,
            firstName: data.firstName,
            phoneNumber: data.phoneNumber,
            city: data.city,
            updatedAt: currentDate,
          })
        }

        if (data.id) {
          await depotDb.update(data.id, {
            contributionStatus: data.contributionStatus,
            contributionAmount: data.contributionAmount,
            updatedAt: currentDate,
          })
        }

        await articleDb.batchUpdate(
          data.articles
            .map((articleForm) => {
              if (!articleForm.id) return
              let status = articleForm.status
              if (articleForm.isDeleted) {
                if (articleForm.status === 'REFUSED') {
                  status = 'RECEPTION_OK'
                } else {
                  status = 'REFUSED'
                }
              }
              return {
                key: articleForm.id,
                changes: {
                  status,
                  price: articleForm.price,
                  discipline: articleForm.discipline,
                  brand: articleForm.brand,
                  category: articleForm.type,
                  size: articleForm.size,
                  color: articleForm.color,
                  model: articleForm.model,
                  updatedAt: currentDate,
                } as const,
              }
            })
            .filter((article) => !!article),
        )
      },
    )
  }

  return {
    mutate,
  }
}
