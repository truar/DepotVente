import { z } from 'zod'

export const EditArticleSchema = z.object({
  id: z.string(),
  price: z.coerce.number<number>().gt(0, { error: 'Le prix est requis' }),
  discipline: z.string().nonempty({ error: 'La discipline est requise' }),
  brand: z.string().nonempty({ error: 'La marque est requise' }),
  type: z.string().nonempty({ error: 'Le type est requis' }),
  size: z.string().nonempty({ error: 'La taille est requise' }),
  color: z.string().nonempty({ error: 'La couleur est requise' }),
  model: z.string().nonempty({ error: 'Le model est requis' }),
  shortArticleCode: z.string(),
})

export type EditArticleFormType = z.infer<typeof EditArticleSchema>
