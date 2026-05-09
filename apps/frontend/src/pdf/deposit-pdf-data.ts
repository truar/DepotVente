import type { DepositPdfProps } from './deposit-pdf'

export type DepositPdfArticleSource = {
  depositIndex: number
  identificationLetter: string
  category: string
  brand: string
  model: string | null | undefined
  discipline: string
  size: string | null | undefined
  price: number
  color: string
  isDeleted: boolean
}

export type DepositPdfDataSource = {
  deposit: {
    depositIndex: number
    year: number
    contributionStatus: string
    contributionAmount: number
  }
  contact: {
    lastName: string
    firstName: string
    phoneNumber: string
    city?: string | null
  }
  articles: Array<DepositPdfArticleSource>
}

export function toDepositPdfData(
  src: DepositPdfDataSource,
): DepositPdfProps['data'] {
  return {
    deposit: src.deposit,
    contact: src.contact,
    articles: src.articles.map((a) => ({
      shortCode: `${a.depositIndex} ${a.identificationLetter}`,
      category: a.category,
      brand: a.brand,
      model: a.model ?? '',
      discipline: a.discipline,
      size: a.size ?? '',
      price: a.price,
      color: a.color,
      isDeleted: a.isDeleted,
    })),
  }
}
