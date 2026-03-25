import { z } from 'zod'

export const ArticleSchema = z.object({
  id: z.string().optional(),
  isDeleted: z.boolean().optional(),
  status: z
    .union([
      z.literal('REFUSED'),
      z.literal('RECEPTION_OK'),
      z.literal('RECEPTION_PENDING'),
      z.literal('SOLD'),
      z.literal('RETURNED'),
    ])
    .optional(),
  softDeletionEnabled: z.boolean().optional(),
  price: z.coerce.number().gt(0, { message: 'Le prix est requis' }),
  discipline: z.string().nonempty({ message: 'La discipline est requise' }),
  brand: z.string().nonempty({ message: 'La marque est requise' }),
  type: z.string().nonempty({ message: 'Le type est requis' }),
  size: z.string().optional(),
  color: z.string().nonempty({ message: 'La couleur est requise' }),
  model: z.string().optional(),
  articleCode: z.string(),
  year: z.number(),
  depotIndex: z.number(),
  identificationLetter: z.string(),
  articleIndex: z.number(),
  shortArticleCode: z.string(),
})

export const DepositSchema = z.object({
  id: z.string().optional(),
  sellerId: z.string().optional(),
  predepositId: z.string().nullable().optional(),
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
