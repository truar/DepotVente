import { type Article, db } from '@/db.ts'
import { syncService } from '@/sync-service.ts'

export function useArticlesDb() {
  async function findByCode(code: string) {
    const articles = await db.articles.where({ code }).toArray()
    if (articles.length > 0) return articles[0]
    return undefined
  }

  function findByDepositId(depositId: string) {
    return db.articles.where({ depositId }).toArray()
  }

  async function markArticleAsReceived(articleId: string) {
    const changes = {
      status: 'RECEPTION_OK' as const,
      updatedAt: new Date(),
    }
    db.articles.update(articleId, changes)

    await syncService.addToOutbox('articles', 'update', articleId, changes)
  }
  async function markArticleAsReturned(articleId: string) {
    const changes = {
      status: 'RETURNED' as const,
      updatedAt: new Date(),
    }
    db.articles.update(articleId, changes)

    await syncService.addToOutbox('articles', 'update', articleId, changes)
  }

  async function batchUpsert(articles: Article[]) {
    db.articles.bulkPut(articles)

    for (const article of articles) {
      await syncService.addToOutbox('articles', 'create', article.id, article)
    }
  }

  async function update(key: string, changes: Partial<Article>) {
    return batchUpdate([{ key, changes }])
  }

  async function batchUpdate(
    articles: readonly { key: string; changes: Partial<Article> }[],
  ) {
    db.articles.bulkUpdate(articles)

    for (const article of articles) {
      await syncService.addToOutbox(
        'articles',
        'update',
        article.key,
        article.changes,
      )
    }
  }
  return {
    batchUpsert,
    batchUpdate,
    findByCode,
    update,
    findByDepositId,
    markArticleAsReceived,
    markArticleAsReturned,
  }
}
