import { db } from '@/db.ts'
import { v4 } from 'uuid'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useDepotsDb } from '@/hooks/useDepotsDb.ts'
import { useContactsDb } from './useContactsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { type DepositFormType } from '@/types/CreateDepositForm.ts'
import { usePredepositsDb } from '@/hooks/usePredepositsDb.ts'

export function useCreateDepot() {
  const [workstation] = useWorkstation()
  const depotDb = useDepotsDb()
  const contactDb = useContactsDb()
  const articleDb = useArticlesDb()
  const predepositsDb = usePredepositsDb()

  async function mutate(data: DepositFormType['deposit']) {
    if (workstation === undefined) throw new Error('Workstation is undefined')
    await db.transaction(
      'rw',
      [db.articles, db.deposits, db.contacts, db.predeposits, db.outbox],
      async () => {
        const currentDate = new Date()
        const contactId = await contactDb.insert({
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

        const depositId = await depotDb.insert({
          id: v4(),
          type: 'PARTICULIER',
          sellerId: contactId,
          contributionStatus: data.contributionStatus,
          contributionAmount: data.contributionAmount,
          depositIndex: data.depotIndex,
          incrementStart: workstation.incrementStart,
          dropWorkstationId: workstation.incrementStart,
          createdAt: currentDate,
          updatedAt: currentDate,
          deletedAt: null,
        })

        await articleDb.batchUpsert(
          data.articles.map((articleForm) => ({
            id: v4(),
            depositId: depositId,
            code: articleForm.articleCode,
            saleId: null,
            status: 'RECEPTION_OK',
            price: articleForm.price,
            discipline: articleForm.discipline,
            brand: articleForm.brand,
            category: articleForm.type,
            size: articleForm.size,
            color: articleForm.color,
            model: articleForm.model,
            year: articleForm.year,
            depositIndex: data.depotIndex,
            articleIndex: articleForm.articleIndex,
            identificationLetter: articleForm.identificationLetter,
            createdAt: currentDate,
            updatedAt: currentDate,
            deletedAt: null,
          })),
        )

        if (data.predepositId) {
          await predepositsDb.update(data.predepositId, {
            depositId,
            updatedAt: currentDate,
          })
        }
      },
    )
  }

  return {
    mutate,
  }
}
