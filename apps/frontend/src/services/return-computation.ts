import type { Article, Deposit } from '@/db.ts'

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

export type ReturnAmounts = {
  soldAmount: number
  clubAmount: number
  dueContributionAmount: number
  sellerAmount: number
  contributionStatus: Deposit['contributionStatus']
}

/**
 * Le retour d'une fiche d'après ses articles vendus : la part du club, ce qui
 * revient au vendeur, et sa cotisation. « Calculer les retours » l'enregistre
 * sur la fiche ; le bilan le refait à chaque mise à jour pour les fiches dont
 * le chèque n'est pas fait, et suit ainsi les ventes de la journée.
 *
 * `clubSaleIds` : les ventes faites au club (« CMR »).
 */
export function computeReturn(
  deposit: Pick<Deposit, 'type' | 'contributionAmount' | 'contributionStatus'>,
  articles: Array<Pick<Article, 'price' | 'saleId'>>,
  clubSaleIds: ReadonlySet<string>,
): ReturnAmounts {
  const soldArticles = articles.filter((article) => !!article.saleId)
  const totalSale = soldArticles.reduce(
    (acc, article) => acc + article.price,
    0,
  )
  // Ce que le club rachète pour dédommager un vol est payé au vendeur sans
  // droits pour la bourse.
  const rightsBase = soldArticles
    .filter((article) => !clubSaleIds.has(article.saleId as string))
    .reduce((acc, article) => acc + article.price, 0)
  const dueAmount = computeDueAmount(rightsBase, deposit.type)
  const sellerAmount = totalSale - dueAmount
  const { dueContributionAmount, contributionStatus } = computeContribution(
    sellerAmount,
    deposit.contributionAmount,
    deposit.contributionStatus,
  )
  return {
    soldAmount: totalSale,
    clubAmount: dueAmount,
    dueContributionAmount,
    sellerAmount: sellerAmount - dueContributionAmount,
    contributionStatus,
  }
}
