import { db } from '@/db.ts'
import { v4 } from 'uuid'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import type { DepotFormType } from '@/types/depot.ts'
import { useDepotDb } from '@/hooks/useDepotDb.ts'
import { useUserDb } from './useUserDb'
import { useArticleDb } from '@/hooks/useArticleDb.ts'

export function useCreateDepot() {
  const [workstation] = useWorkstation()
  const depotDb = useDepotDb()
  const userDb = useUserDb()
  const articleDb = useArticleDb()
  async function mutate(data: DepotFormType) {
    await db.transaction('rw', db.articles, db.depots, db.users, async () => {
      const userId = await userDb.upsert({
        id: v4(),
        lastName: data.lastName,
        firstName: data.firstName,
        phoneNumber: data.phoneNumber,
      })

      const depotCount = await depotDb.count()
      const depotIndex = workstation + depotCount + 1
      const depotId = await depotDb.upsert({
        id: v4(),
        userId,
        workstation: workstation,
        depotIndex,
      })

      await articleDb.batchUpsert(
        data.articles.map((articleForm) => ({
          id: v4(),
          depotId,
          articleCode: articleForm.articleCode,
          price: articleForm.price,
          discipline: articleForm.discipline,
          brand: articleForm.brand,
          type: articleForm.type,
          size: articleForm.size,
          color: articleForm.color,
          model: articleForm.model,
          year: articleForm.year,
          depotIndex,
          articleIndex: articleForm.articleIndex,
          workstation,
        })),
      )
    })
  }

  return {
    mutate,
  }
}
