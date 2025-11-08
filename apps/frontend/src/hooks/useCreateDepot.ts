import { db } from '@/db.ts'
import { v4 } from 'uuid'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import type { DepotFormType } from '@/types/depot.ts'

export function useCreateDepot() {
  const [workstation] = useWorkstation()

  async function mutate(data: DepotFormType) {
    await db.transaction('rw', db.articles, db.depots, db.users, async () => {
      const userId = await db.users.add({
        id: v4(),
        lastName: data.lastName,
        firstName: data.firstName,
        phoneNumber: data.phoneNumber,
      })

      const depotCount = await db.depots
        .where({ workstation: workstation })
        .count()
      const depotIndex = workstation + depotCount + 1
      const depotId = await db.depots.add({
        id: v4(),
        userId,
        workstation: workstation,
        depotIndex,
      })

      await db.articles.bulkAdd(
        data.articles.map((article) => ({
          id: v4(),
          depotId,
          articleCode: article.articleCode,
          price: article.price,
          description: article.description,
          brand: article.brand,
          type: article.type,
          size: article.size,
          color: article.color,
          model: article.model,
          workstation: workstation,
        })),
      )
    })
  }

  return {
    mutate,
  }
}
