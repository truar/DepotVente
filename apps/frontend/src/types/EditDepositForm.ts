import { z } from 'zod'
import { ArticleSchema, DepositSchema } from '@/types/depotForm.ts'

export const EditArticleSchema = ArticleSchema.extend({
  id: z.string(),
  status: z.union([
    z.literal('RECEPTION_PENDING'),
    z.literal('RECEPTION_OK'),
    z.literal('REFUSED'),
  ]),
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
