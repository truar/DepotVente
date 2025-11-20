import { db, type Article } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useArticlesDb() {
  async function findByCode(code: string) {
    const articles = await db.articles.where({ code }).toArray()
    if (articles.length > 0) return articles[0]
    return undefined
  }

  async function batchUpsert(articles: Article[]) {
    db.articles.bulkPut(articles)

    for (const article of articles) {
      await syncService.addToOutbox('articles', 'create', article.id, article)
    }
  }

  async function batchUpdate(
    articles: readonly { key: string; changes: Partial<Article> }[],
  ) {
    db.articles.bulkUpdate(articles)

    // for (const article of articles) {
    //   await syncService.addToOutbox('articles', 'create', article.id, article)
    // }
  }
  return { batchUpsert, batchUpdate, findByCode }
}
