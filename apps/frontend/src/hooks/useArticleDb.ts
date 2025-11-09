import { db, type Article } from '@/db.ts'

export function useArticleDb() {
  function batchUpsert(articles: Article[]) {
    return db.articles.bulkPut(articles)
  }
  return { batchUpsert }
}
