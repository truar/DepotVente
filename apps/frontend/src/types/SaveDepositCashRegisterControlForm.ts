import { z } from 'zod'
import { normalizeDecimal } from '@/utils'

export const CashRegisterControlFormSchema = z.object({
  id: z.string().optional(),
  cashRegisterId: z.number(),
  // Tapé par la personne qui fait le contrôle, jamais prérempli : vide, il
  // bloque l'impression et la validation ; 0 reste une réponse. « 80,50 »
  // vaut « 80.50 ».
  initialAmount: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === ''
        ? undefined
        : normalizeDecimal(value),
    z.coerce.number({ error: 'Le fonds de caisse est obligatoire' }),
  ),
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
