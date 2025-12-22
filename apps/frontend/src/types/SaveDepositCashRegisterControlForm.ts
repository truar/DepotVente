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
})

export type CashRegisterControlFormType = z.infer<
  typeof CashRegisterControlFormSchema
>
