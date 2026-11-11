import type { InvoicePdfProps } from './invoice-pdf'
import { db } from '@/db'
import { getYear } from '@/utils'

// La facture d'une vente telle que sa page de modification l'imprime : les
// articles qu'elle garde, et ce que l'acheteur a payé une fois ses
// remboursements rendus. Datée du jour de l'impression, comme à la caisse.
export async function loadInvoicePdfData(
  saleId: string,
): Promise<InvoicePdfProps['data'] | undefined> {
  const sale = await db.sales.get(saleId)
  if (!sale) return undefined

  const contact = await db.contacts.get(sale.buyerId)
  if (!contact) throw new Error('No contact found for sale')
  const articles = await db.articles.where({ saleId }).sortBy('code')
  const refunds = await db.refunds
    .where({ saleId })
    .filter((refund) => refund.deletedAt == null)
    .toArray()
  const refunded = refunds.reduce(
    (total, refund) => ({
      card: total.card + refund.cardAmount,
      cash: total.cash + refund.cashAmount,
    }),
    { card: 0, cash: 0 },
  )

  return {
    sale: {
      saleIndex: sale.saleIndex,
      year: getYear(),
      date: new Date(),
    },
    contact: {
      lastName: contact.lastName,
      firstName: contact.firstName,
      phoneNumber: contact.phoneNumber,
    },
    articles: articles.map((article) => ({
      code: article.code,
      category: article.category,
      brand: article.brand,
      model: article.model,
      discipline: article.discipline,
      price: article.price,
    })),
    payments: {
      cash: (sale.cashAmount ?? 0) - refunded.cash,
      card: (sale.cardAmount ?? 0) - refunded.card,
      check: sale.checkAmount ?? 0,
    },
  }
}
