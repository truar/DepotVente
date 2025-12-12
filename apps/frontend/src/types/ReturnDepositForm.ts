import { z } from 'zod'

export const IndividualReturnForm = z.object({
  signatory: z.string(),
  workstation: z.coerce.number(),
  checkId: z.coerce.number(),
  depositId: z.string().nullable().optional(),
})
export type IndividualReturnFormType = z.infer<typeof IndividualReturnForm>
