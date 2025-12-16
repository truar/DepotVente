import { z } from 'zod'
import { ArticleSchema, DepositSchema } from '@/types/CreateDepositForm.ts'

export const EditArticleSchema = ArticleSchema.extend({
  id: z.string(),
})

export const EditDepositSchema = DepositSchema.extend({
  id: z.string(),
  sellerId: z.string(),
  articles: z.array(EditArticleSchema),
})

export const EditDepositFormSchema = z.object({
  isSummaryPrinted: z.literal(true),
  deposit: EditDepositSchema,
})

export type EditDepositFormType = z.infer<typeof EditDepositFormSchema>
