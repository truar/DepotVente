import { z } from 'zod'
import { ArticleSchema } from '@/types/CreateDepositForm.ts'
import { SaleFormSchema } from '@/types/saleForm.ts'

export const EditArticleSchema = ArticleSchema.extend({
  id: z.string(),
  isDeleted: z.boolean().optional(),
  articleCode: z.string(),
  discipline: z.string(),
  category: z.string(),
  brand: z.string(),
  model: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  price: z.coerce.number(),
  type: z.string().optional(),
})

export const EditSaleSchema = SaleFormSchema.extend({
  id: z.string(),
  contactId: z.string(),
  refundCardAmount: z.coerce.number().nullable(),
  refundCashAmount: z.coerce.number().nullable(),
  refundComment: z.string().nullable().optional(),
  articles: z.array(EditArticleSchema),
})

export type EditSaleFormType = z.infer<typeof EditSaleSchema>
