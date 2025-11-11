import { db } from '@/db.ts'
import { v4 } from 'uuid'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import type { DepotFormType } from '@/types/depot.ts'
import { useDepotDb } from '@/hooks/useDepotDb.ts'
import { useContactDb } from './useContactDb.ts'
import { useArticleDb } from '@/hooks/useArticleDb.ts'

export function useCreateDepot() {
  const [workstation] = useWorkstation()
  const depotDb = useDepotDb()
  const contactDb = useContactDb()
  const articleDb = useArticleDb()
  async function mutate(data: DepotFormType) {
    if (workstation === undefined) throw new Error('Workstation is undefined')
    await db.transaction(
      'rw',
      db.articles,
      db.deposits,
      db.contacts,
      db.outbox,
      async () => {
        const currentDate = new Date()
        const contactId = await contactDb.upsert({
          id: v4(),
          lastName: data.lastName,
          firstName: data.firstName,
          phoneNumber: data.phoneNumber,
          city: null,
          postalCode: null,
          createdAt: currentDate,
          updatedAt: currentDate,
          deletedAt: null,
        })

        const depotCount = await depotDb.count()
        const depotIndex = workstation.incrementStart + depotCount + 1
        const depotId = await depotDb.upsert({
          id: v4(),
          sellerId: contactId,
          workstationId: workstation.id,
          contributionStatus: data.cotisationPayee ? 'PAYER' : 'A_PAYER',
          eventId: workstation.eventId,
          depositIndex: depotIndex,
          createdAt: currentDate,
          updatedAt: currentDate,
          deletedAt: null,
        })

        await articleDb.batchUpsert(
          data.articles.map((articleForm) => ({
            id: v4(),
            depositId: depotId,
            code: articleForm.articleCode,
            saleId: null,
            price: articleForm.price,
            discipline: articleForm.discipline,
            brand: articleForm.brand,
            category: articleForm.type,
            size: articleForm.size,
            color: articleForm.color,
            model: articleForm.model,
            year: articleForm.year,
            depositIndex: depotIndex,
            articleIndex: articleForm.articleIndex,
            workstationId: workstation.id,
            eventId: workstation.eventId,
            createdAt: currentDate,
            updatedAt: currentDate,
            deletedAt: null,
          })),
        )
      },
    )
  }

  return {
    mutate,
  }
}
