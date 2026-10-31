import { z } from 'zod'

// Le n° imprimé sur le chèque : tapé au retour, corrigeable ensuite sur
// « Visualiser les chèques ».
export const CheckIdSchema = z.coerce
  .number({ error: 'Le n° de chèque est obligatoire' })
  .int('Le n° de chèque est obligatoire')
  .min(1, 'Le n° de chèque est obligatoire')

export const IndividualReturnForm = z.object({
  signatory: z
    .string({ error: 'Le signataire est obligatoire' })
    .trim()
    .min(1, 'Le signataire est obligatoire'),
  workstation: z.coerce.number(),
  checkId: CheckIdSchema,
  depositId: z.string().nullable().optional(),
  contributionPaid: z.boolean().optional(),
})
export type IndividualReturnFormType = z.infer<typeof IndividualReturnForm>
