import { z } from 'zod'

export const IndividualReturnForm = z.object({
  signatory: z
    .string({ error: 'Le signataire est obligatoire' })
    .trim()
    .min(1, 'Le signataire est obligatoire'),
  workstation: z.coerce.number(),
  checkId: z.coerce
    .number({ error: 'Le n° de chèque est obligatoire' })
    .int('Le n° de chèque est obligatoire')
    .min(1, 'Le n° de chèque est obligatoire'),
  depositId: z.string().nullable().optional(),
  contributionPaid: z.boolean().optional(),
})
export type IndividualReturnFormType = z.infer<typeof IndividualReturnForm>
