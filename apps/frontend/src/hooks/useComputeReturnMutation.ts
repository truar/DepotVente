import type { Article } from '@/db'
import { db } from '@/db'
import { isClubBuyer } from '@/utils'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { computeReturn } from '@/services/return-computation.ts'

// The ids of the sales, among those of these sold articles, that went to the
// club (« CMR »).
async function salesToTheClub(
  soldArticles: Array<Article>,
): Promise<Set<string>> {
  const saleIds = [
    ...new Set(soldArticles.map((article) => article.saleId as string)),
  ]
  const sales = await db.sales.bulkGet(saleIds)
  const buyers = await db.contacts.bulkGet(
    sales.map((sale) => sale?.buyerId ?? ''),
  )
  return new Set(
    sales
      .filter(
        (sale, index) => sale && buyers[index] && isClubBuyer(buyers[index]),
      )
      .map((sale) => sale!.id),
  )
}

export function useComputeReturnMutation() {
  const depositsDb = useDepositsDb()
  const articlesDb = useArticlesDb()
  async function mutate(depositId: string) {
    const deposit = await depositsDb.get(depositId)
    if (!deposit) return
    // Une fois le chèque du vendeur fait, ce qu'il porte est définitif : le
    // calcul ne touche plus à la fiche.
    if (deposit.checkId != null) return
    const articles = await articlesDb.findByDepositId(depositId)
    const clubSaleIds = await salesToTheClub(
      articles.filter((article) => !!article.saleId),
    )
    const date = new Date()
    await depositsDb.update(depositId, {
      returnedCalculationDate: date,
      ...computeReturn(deposit, articles, clubSaleIds),
    })
  }

  return { mutate }
}
