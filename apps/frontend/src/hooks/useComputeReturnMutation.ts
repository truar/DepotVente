import { type Deposit } from '@/db'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'

function computeDueAmount(totalSale: number, depositType: Deposit['type']) {
  if (depositType === 'PARTICULIER') return totalSale * 0.1
  return totalSale * 0.15
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
      .reduce((acc, article) => acc + parseInt(`${article.price}`), 0)
    const dueContributionAmount =
      deposit.contributionStatus === 'A_PAYER'
        ? parseInt(`${deposit.contributionAmount}`)
        : 0
    const dueAmount =
      computeDueAmount(totalSale, deposit.type) + dueContributionAmount
    const sellerAmount = totalSale - dueAmount
    const date = new Date()
    await depositsDb.update(depositId, {
      returnedCalculationDate: date,
      soldAmount: totalSale,
      clubAmount: dueAmount,
      sellerAmount: sellerAmount,
      contributionStatus:
        dueContributionAmount > 0 && sellerAmount >= 0
          ? 'DEDUITE'
          : deposit.contributionStatus,
    })
  }

  return { mutate }
}
