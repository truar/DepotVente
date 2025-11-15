import { z } from 'zod'

export enum TypeEnum {
  Chaussures = 'Chaussures',
  Skis = 'Skis',
  Batons = 'Bâtons',
  Snowboard = 'Snowboard',
}

export const ArticleSchema = z.object({
  price: z.number(),
  discipline: z.string(),
  brand: z.string(),
  type: z.enum(TypeEnum),
  size: z.string(),
  color: z.string(),
  model: z.string(),
  articleCode: z.string(),
  year: z.number(),
  depotIndex: z.number(),
  articleIndex: z.string(),
  shortArticleCode: z.string(),
})

export type ArticleFormType = z.infer<typeof ArticleSchema>

export const DepotSchema = z.object({
  depotIndex: z.number(),
  lastName: z.string(),
  firstName: z.string(),
  phoneNumber: z.string(),
  cotisationPayee: z.boolean(),
  articles: z.array(ArticleSchema),
})

export type DepotFormType = z.infer<typeof DepotSchema>
