import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import type { Predeposit, PredepositArticle } from '@/db.ts'
import { db } from '@/db.ts'
import {
  computeContributionAmount,
  generateArticleCode,
  generateIdentificationLetter,
  getYear,
  shortArticleCode,
  sortByIdentificationLetter,
} from '@/utils'

// What the "Valider" button next to the predeposit combobox does: turn a
// predeposit and its articles into the values of the deposit form, under
// the deposit number this cash register is about to assign. The operator
// still picks the contribution status and may edit anything before saving.
export function depositFormFromPredeposit(
  predeposit: Predeposit,
  predepositArticles: Array<PredepositArticle>,
  depositIndex: number,
): DepositFormType['deposit'] {
  const articles = sortByIdentificationLetter(predepositArticles)
  const year = getYear()
  return {
    depotIndex: depositIndex,
    predepositId: predeposit.id,
    lastName: predeposit.sellerLastName,
    firstName: predeposit.sellerFirstName,
    phoneNumber: predeposit.sellerPhoneNumber,
    city: predeposit.sellerCity,
    // Chosen by the operator on the form; the schema refuses null on submit.
    contributionStatus:
      null as unknown as DepositFormType['deposit']['contributionStatus'],
    contributionAmount: computeContributionAmount(articles.length),
    articles: articles.map((article, index) => {
      const identificationLetter = generateIdentificationLetter(index)
      return {
        id: article.id,
        articleCode: generateArticleCode(
          year,
          depositIndex,
          identificationLetter,
        ),
        price: article.price,
        color: article.color,
        depotIndex: depositIndex,
        articleIndex: article.articleIndex,
        discipline: article.discipline,
        size: article.size,
        year: article.year,
        type: article.category,
        model: article.model,
        brand: article.brand,
        softDeletionEnabled: true,
        identificationLetter: article.identificationLetter,
        shortArticleCode: shortArticleCode(
          depositIndex,
          article.identificationLetter,
        ),
      }
    }) as DepositFormType['deposit']['articles'],
  }
}

export async function loadDepositFormFromPredeposit(
  predepositId: string,
  depositIndex: number,
): Promise<DepositFormType['deposit'] | undefined> {
  const predeposit = await db.predeposits.get(predepositId)
  if (!predeposit) return undefined
  const articles = await db.predepositArticles.where({ predepositId }).toArray()
  return depositFormFromPredeposit(predeposit, articles, depositIndex)
}
