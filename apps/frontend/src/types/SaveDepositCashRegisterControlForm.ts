import { z } from 'zod'

export const CashRegisterControlFormSchema = z.object({
  id: z.string().optional(),
  cashRegisterId: z.number(),
  initialAmount: z.coerce.number(),
  realAmount: z.coerce.number(),
  theoreticalAmount: z.coerce.number(),
  amounts: z.array(
    z.object({
      amount: z.coerce.number(),
      value: z.coerce.number(),
    }),
  ),
  comment: z.string().trim().min(1, 'Le commentaire est obligatoire'),
})

export type CashRegisterControlFormType = z.infer<
  typeof CashRegisterControlFormSchema
>
