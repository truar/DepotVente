import { z } from 'zod'
import { normalizeDecimal } from '@/utils'

export const EditArticleSchema = z
  .object({
    id: z.string(),
    // Tapé « 12,50 » comme « 12.50 ».
    price: z.preprocess(
      normalizeDecimal,
      z.coerce.number().gt(0, { message: 'Le prix est requis' }),
    ),
    discipline: z.string().nonempty({ message: 'La discipline est requise' }),
    brand: z.string().nonempty({ message: 'La marque est requise' }),
    type: z.string().nonempty({ message: 'Le type est requis' }),
    size: z.string().nonempty({ message: 'La taille est requise' }),
    // Facultative ici : un article corrigé peut rester sans couleur.
    color: z.string(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    // « Message caisse ».
    saleAlert: z.string().optional(),
    articleCode: z.string(),
    shortArticleCode: z.string(),
    isDeleted: z.boolean().optional(),
    status: z
      .union([
        z.literal('DELETED'),
        z.literal('ABSENT'),
        z.literal('RECEPTION_OK'),
        z.literal('RECEPTION_PENDING'),
        z.literal('SOLD'),
        z.literal('RETURNED'),
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'DELETED' && !data.model?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['model'],
        message: 'La description est requise lors de la suppression',
      })
    }
  })

export type EditArticleFormType = z.infer<typeof EditArticleSchema>
