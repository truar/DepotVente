import type { Article, Deposit } from '@/db'
import { db } from '@/db'
import { isClubBuyer } from '@/utils'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'

function computeDueAmount(totalSale: number, depositType: Deposit['type']) {
  if (depositType === 'PARTICULIER') return totalSale * 0.1
  return totalSale * 0.15
}

function computeContribution(
  sellerAmount: number,
  contributionAmount: number,
  contributionStatus: Deposit['contributionStatus'],
): {
  dueContributionAmount: number
  contributionStatus: Deposit['contributionStatus']
} {
  const sellerCanRefundContribution = sellerAmount >= contributionAmount
  if (
    (contributionStatus === 'A_PAYER' || contributionStatus === 'DEDUITE') &&
    sellerCanRefundContribution
  ) {
    return {
      dueContributionAmount: contributionAmount,
      contributionStatus: 'DEDUITE',
    }
  }
  if (
    (contributionStatus === 'A_PAYER' || contributionStatus === 'DEDUITE') &&
    !sellerCanRefundContribution
  ) {
    return {
      dueContributionAmount: 0,
      contributionStatus: 'A_PAYER',
    }
  }

  // PAYE, SOLDE, PRO, GRATUIT : rien à déduire du chèque, la cotisation est
  // déjà réglée (ou n'est pas due). Un dépôt soldé le soir doit rester SOLDE,
  // sinon il serait encaissé deux fois.
  return { dueContributionAmount: 0, contributionStatus }
}

// The ids of the articles whose sale went to the club (« CMR »).
async function boughtByTheClub(
  soldArticles: Array<Article>,
): Promise<Set<string>> {
  const saleIds = [
    ...new Set(soldArticles.map((article) => article.saleId as string)),
  ]
  const sales = await db.sales.bulkGet(saleIds)
  const buyers = await db.contacts.bulkGet(
    sales.map((sale) => sale?.buyerId ?? ''),
  )
  const clubSaleIds = new Set(
    sales
      .filter(
        (sale, index) => sale && buyers[index] && isClubBuyer(buyers[index]),
      )
      .map((sale) => sale!.id),
  )
  return new Set(
    soldArticles
      .filter((article) => clubSaleIds.has(article.saleId as string))
      .map((article) => article.id),
  )
}

export function useComputeReturnMutation() {
  const depositsDb = useDepositsDb()
  const articlesDb = useArticlesDb()
  async function mutate(depositId: string) {
    const deposit = await depositsDb.get(depositId)
    if (!deposit) return
    const articles = await articlesDb.findByDepositId(depositId)

    const soldArticles = articles.filter((article) => !!article.saleId)
    const totalSale = soldArticles.reduce(
      (acc, article) => acc + article.price,
      0,
    )
    // Ce que le club rachète pour dédommager un vol est payé au vendeur sans
    // droits pour la bourse.
    const boughtByClub = await boughtByTheClub(soldArticles)
    const rightsBase = soldArticles
      .filter((article) => !boughtByClub.has(article.id))
      .reduce((acc, article) => acc + article.price, 0)
    const dueAmount = computeDueAmount(rightsBase, deposit.type)
    const sellerAmount = totalSale - dueAmount
    const contributionAmount = deposit.contributionAmount
    const { dueContributionAmount, contributionStatus } = computeContribution(
      sellerAmount,
      contributionAmount,
      deposit.contributionStatus,
    )
    const date = new Date()
    await depositsDb.update(depositId, {
      returnedCalculationDate: date,
      soldAmount: totalSale,
      clubAmount: dueAmount,
      dueContributionAmount: dueContributionAmount,
      sellerAmount: sellerAmount - dueContributionAmount,
      contributionStatus: contributionStatus,
    })
  }

  return { mutate }
}
