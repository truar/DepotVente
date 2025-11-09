export enum TypeEnum {
  Chaussures = 'Chaussures',
  Skis = 'Skis',
  Batons = 'Bâtons',
  Snowboard = 'Snowboard',
}

export type ArticleFormType = {
  price: number
  description: string
  brand: string
  type: string
  size: string
  color: string
  model: string
  articleCode: string
  shortArticleCode: string
}

export type DepotFormType = {
  depotIndex: number
  lastName: string
  firstName: string
  phoneNumber: string
  cotisationPayee: boolean
  articles: ArticleFormType[]
}
