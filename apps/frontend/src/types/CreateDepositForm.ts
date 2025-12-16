import { z } from 'zod'

export const ArticleSchema = z.object({
  isDeleted: z.boolean().optional(),
  price: z.coerce.number().gt(0, { message: 'Le prix est requis' }),
  discipline: z.string().nonempty({ message: 'La discipline est requise' }),
  brand: z.string().nonempty({ message: 'La marque est requise' }),
  type: z.string().nonempty({ message: 'Le type est requis' }),
  size: z.string().nonempty({ message: 'La taille est requise' }),
  color: z.string().nonempty({ message: 'La couleur est requise' }),
  model: z.string().nonempty({ message: 'Le model est requis' }),
  articleCode: z.string(),
  year: z.number(),
  depotIndex: z.number(),
  identificationLetter: z.string(),
  articleIndex: z.number(),
  shortArticleCode: z.string(),
})

export const DepositSchema = z.object({
  predepositId: z.string().nullable(),
  depotIndex: z.number(),
  lastName: z.string().nonempty({ message: 'Le nom est requis' }),
  firstName: z.string().nonempty({ message: 'Le prénom est requis' }),
  phoneNumber: z.string().nonempty({ message: 'Le téléphone est requis' }),
  city: z.string().nullable(),
  contributionStatus: z.union([
    z.literal('A_PAYER'),
    z.literal('PAYEE'),
    z.literal('PRO'),
    z.literal('GRATUIT'),
  ]),
  contributionAmount: z.coerce.number(),
  articles: z
    .array(ArticleSchema)
    .nonempty({ message: 'Au moins un article est requis' }),
})

export const DepositFormSchema = z.object({
  isSummaryPrinted: z.boolean(),
  deposit: DepositSchema,
})

export type DepositFormType = z.infer<typeof DepositFormSchema>
