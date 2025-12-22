import { type Deposit } from '@/db'
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

  return { dueContributionAmount: 0, contributionStatus }
}

export function useComputeReturnMutation() {
  const depositsDb = useDepositsDb()
  const articlesDb = useArticlesDb()
  async function mutate(depositId: string) {
    const deposit = await depositsDb.get(depositId)
    if (!deposit) return
    const articles = await articlesDb.findByDepositId(depositId)

    const totalSale = articles
      .filter((article) => !!article.saleId)
      .reduce((acc, article) => acc + parseFloat(`${article.price}`), 0)
    console.log(totalSale)
    const dueAmount = computeDueAmount(totalSale, deposit.type)
    const sellerAmount = totalSale - dueAmount
    const contributionAmount = parseInt(`${deposit.contributionAmount}`) ?? 0
    console.log(contributionAmount)
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
