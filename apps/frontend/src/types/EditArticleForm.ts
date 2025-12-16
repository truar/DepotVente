import { z } from 'zod'

export const EditArticleSchema = z.object({
  id: z.string(),
  price: z.coerce.number().gt(0, { message: 'Le prix est requis' }),
  discipline: z.string().nonempty({ message: 'La discipline est requise' }),
  brand: z.string().nonempty({ message: 'La marque est requise' }),
  type: z.string().nonempty({ message: 'Le type est requis' }),
  size: z.string().nonempty({ message: 'La taille est requise' }),
  color: z.string().optional(),
  model: z.string().nonempty({ message: 'Le model est requis' }),
  articleCode: z.string(),
  shortArticleCode: z.string(),
  isDeleted: z.boolean().optional(),
})

export type EditArticleFormType = z.infer<typeof EditArticleSchema>
