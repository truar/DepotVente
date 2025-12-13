import { z } from 'zod'

export const EditArticleSchema = z.object({
  id: z.string(),
  price: z.coerce.number<number>().gt(0, { error: 'Le prix est requis' }),
  discipline: z.string().nonempty({ error: 'La discipline est requise' }),
  brand: z.string().nonempty({ error: 'La marque est requise' }),
  type: z.string().nonempty({ error: 'Le type est requis' }),
  size: z.string().nonempty({ error: 'La taille est requise' }),
  color: z.string().optional(),
  model: z.string().nonempty({ error: 'Le model est requis' }),
  articleCode: z.string(),
  shortArticleCode: z.string(),
  status: z.union([
    z.literal('RECEPTION_PENDING'),
    z.literal('RECEPTION_OK'),
    z.literal('REFUSED'),
    z.literal('RETURNED'),
    z.literal('SOLD'),
  ]),
})

export type EditArticleFormType = z.infer<typeof EditArticleSchema>
