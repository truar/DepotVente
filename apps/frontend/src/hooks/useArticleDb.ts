import { db, type Article } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useArticleDb() {
  async function batchUpsert(articles: Article[]) {
    db.articles.bulkPut(articles)

    for (const article of articles) {
      await syncService.addToOutbox('articles', 'create', article.id, article)
    }
  }
  return { batchUpsert }
}
