import { z } from 'zod'

export const ArticleFormSchema = z.object({
  id: z.string(),
  articleCode: z.string(),
  discipline: z.string(),
  category: z.string(),
  brand: z.string(),
  model: z.string(),
  color: z.string(),
  size: z.string(),
  price: z.number(),
})

export const SaleFormSchema = z.object({
  saleIndex: z.coerce.number(),
  contactId: z.string().nullable(),
  lastName: z.string().nonempty({ message: 'Le nom est requis' }),
  firstName: z.string().nonempty({ message: 'Le prénom est requis' }),
  phoneNumber: z.string().nonempty({ message: 'Le téléphone est requis' }),
  city: z.string().nullable(),
  cardAmount: z.coerce.number<number>().nullable(),
  cashAmount: z.coerce.number<number>().nullable(),
  checkAmount: z.coerce.number<number>().nullable(),
  articles: z.array(ArticleFormSchema).optional(),
})

export type SaleFormType = z.infer<typeof SaleFormSchema>
