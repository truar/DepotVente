import { useCallback } from 'react'
import type { EditArticleFormType } from '@/types/EditArticleForm.ts'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'

export function useEditArticle() {
  const articlesDb = useArticlesDb()

  const mutate = useCallback(
    async (data: EditArticleFormType) => {
      await articlesDb.update(data.id, {
        price: data.price,
        discipline: data.discipline,
        brand: data.brand,
        category: data.type,
        size: data.size,
        color: data.color,
        model: data.model,
        updatedAt: new Date(),
      })
    },
    [articlesDb],
  )

  return { mutate }
}
