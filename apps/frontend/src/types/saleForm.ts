import { z } from 'zod'
import { normalizeDecimal } from '@/utils'

export const ArticleFormSchema = z.object({
  id: z.string(),
  articleCode: z.string(),
  shortArticleCode: z.string(),
  discipline: z.string(),
  category: z.string(),
  brand: z.string(),
  model: z.string(),
  color: z.string(),
  size: z.string(),
  price: z.coerce.number(),
})

const contactSchema = z.object({
  contactId: z.string().nullable(),
  lastName: z.string().nonempty({ message: 'Le nom est requis' }),
  firstName: z.string().nonempty({ message: 'Le prénom est requis' }),
  phoneNumber: z.string().nonempty({ message: 'Le téléphone est requis' }),
  city: z.string().nullable(),
})

// Les règlements sont tapés : « 12,50 » comme « 12.50 ».
export const SaleFormSchema = z.object({
  saleIndex: z.coerce.number(),
  buyer: contactSchema,
  cardAmount: z.preprocess(normalizeDecimal, z.coerce.number().nullable()),
  cashAmount: z.preprocess(normalizeDecimal, z.coerce.number().nullable()),
  checkAmount: z.preprocess(normalizeDecimal, z.coerce.number().nullable()),
  deferredAmount: z.preprocess(normalizeDecimal, z.coerce.number().nullable()),
  articles: z
    .array(ArticleFormSchema)
    .nonempty({ message: 'Au moins un article est requis' }),
})

export type SaleFormType = z.infer<typeof SaleFormSchema>
