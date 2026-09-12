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

// Une ligne par remboursement rendu à l'acheteur. Une ligne déjà
// enregistrée porte son id et la caisse qui a sorti l'argent ; la ligne en
// cours de saisie n'a ni l'un ni l'autre : la caisse du poste y est apposée
// à l'enregistrement.
export const RefundLineSchema = z.object({
  id: z.string().nullable(),
  incrementStart: z.number().nullable(),
  cardAmount: z.coerce.number().nullable(),
  cashAmount: z.coerce.number().nullable(),
  comment: z.string().nullable().optional(),
})

export type RefundLineType = z.infer<typeof RefundLineSchema>

export function refundLineTotal(line: RefundLineType): number {
  return (line.cardAmount ?? 0) + (line.cashAmount ?? 0)
}

export function refundsTotal(lines: Array<RefundLineType> = []): number {
  return lines.reduce((total, line) => total + refundLineTotal(line), 0)
}

export const EditSaleSchema = SaleFormSchema.extend({
  id: z.string(),
  refunds: z.array(RefundLineSchema),
  articles: z.array(EditArticleSchema),
}).superRefine((data, ctx) => {
  data.refunds.forEach((line, index) => {
    if (refundLineTotal(line) > 0 && !line.comment?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['refunds', index, 'comment'],
        message: 'Merci de saisir un commentaire pour le remboursement',
      })
    }
  })
})

export type EditSaleFormType = z.infer<typeof EditSaleSchema>
