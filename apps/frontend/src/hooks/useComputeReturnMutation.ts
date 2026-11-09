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
  // `despiteCheck` : l'administrateur a confirmé qu'il recalcule une fiche
  // dont le chèque est déjà fait (une vente annulée après coup). Sans lui, ce
  // que la fiche porte une fois le chèque fait est définitif.
  async function mutate(
    depositId: string,
    options?: { despiteCheck?: boolean },
  ) {
    const deposit = await depositsDb.get(depositId)
    if (!deposit) return
    if (deposit.checkId != null && !options?.despiteCheck) return
    const articles = await articlesDb.findByDepositId(depositId)
    const clubSaleIds = await salesToTheClub(
      articles.filter((article) => !!article.saleId),
    )
    const date = new Date()
    await depositsDb.update(depositId, {
      returnedCalculationDate: date,
      ...computeReturn(deposit, articles, clubSaleIds),
      // Le chèque garde le montant écrit dessus. Un chèque fait avant que ce
      // montant soit enregistré le prend sur la fiche, avant qu'elle change.
      ...(deposit.checkId != null && deposit.checkAmount == null
        ? { checkAmount: deposit.sellerAmount ?? 0 }
        : {}),
    })
  }

  return { mutate }
}
