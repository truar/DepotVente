import { z } from 'zod'
import { ArticleSchema } from '@/types/CreateDepositForm.ts'
import { SaleFormSchema } from '@/types/saleForm.ts'

export const EditArticleSchema = ArticleSchema.extend({
  id: z.string(),
  isDeleted: z.boolean().optional(),
  articleCode: z.string().optional(),
  discipline: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  price: z.coerce.number().optional(),
  type: z.string().optional(),
})

export const EditSaleSchema = SaleFormSchema.extend({
  id: z.string(),
  refundCardAmount: z.coerce.number<number>().nullable(),
  refundCashAmount: z.coerce.number<number>().nullable(),
  refundComment: z.string().optional(),
  articles: z.array(EditArticleSchema),
})

export type EditSaleFormType = z.infer<typeof EditSaleSchema>
