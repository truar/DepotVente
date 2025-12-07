import { z } from 'zod'
import { ArticleSchema } from '@/types/CreateDepositForm.ts'
import { SaleFormSchema } from '@/types/saleForm.ts'

export const EditArticleSchema = ArticleSchema.extend({
  id: z.string(),
})

export const EditSaleSchema = SaleFormSchema.extend({
  id: z.string(),
  articles: z.array(EditArticleSchema),
})

export type EditSaleFormType = z.infer<typeof EditSaleSchema>
