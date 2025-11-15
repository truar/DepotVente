import { z } from 'zod'

export enum TypeEnum {
  Chaussures = 'Chaussures',
  Skis = 'Skis',
  Batons = 'Bâtons',
  Snowboard = 'Snowboard',
}

export const ArticleSchema = z.object({
  price: z.coerce.number<number>().gt(0, { error: 'Le prix est requis' }),
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
  lastName: z.string().nonempty({ message: 'Le nom est requis' }),
  firstName: z.string().nonempty({ message: 'Le prénom est requis' }),
  phoneNumber: z.string().nonempty({ message: 'Le téléphone est requis' }),
  cotisationPayee: z.boolean(),
  articles: z
    .array(ArticleSchema)
    .nonempty({ message: 'Au moins un article est requis' }),
})

export type DepotFormType = z.infer<typeof DepotSchema>
