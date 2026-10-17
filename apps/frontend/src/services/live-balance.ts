import type { BilanPdfData, DepositTypeFigures } from '@/pdf/bilan-pdf.tsx'
import { db, toIsoString } from '@/db.ts'
import {
  add,
  isReportedSaleRegister,
  loadBilanPdfData,
  sumOf,
} from '@/pdf/load-bilan-pdf-data.ts'

type DepositAverage = { amount: number; articles: number }

export type LiveBalance = {
  // Les chiffres du bilan, tels que le PDF les imprimerait à cet instant.
  balance: BilanPdfData
  // Les espèces que les caisses de vente devraient contenir d'après les
  // ventes, comme le théorique de leur contrôle : elles ne sont pas encore
  // comptées.
  expectedCash: number
  // Le « panier » d'un dépôt : ce qu'une fiche met en vente en moyenne, en
  // euros et en articles, particuliers et pros à part — quelques fiches pros
  // de centaines d'articles noieraient la moyenne des particuliers. Mêmes
  // fiches et mêmes articles que le bilan.
  depositAverage: Record<'particuliers' | 'pros', DepositAverage>
  // La dernière vente arrivée dans la base de ce poste, et sa caisse.
  lastSale: { at: string; cashRegisterId: number } | null
}

/**
 * Ce que le suivi en direct affiche : le bilan du moment, plus les espèces
 * attendues, le dépôt moyen et la dernière vente reçue. Mêmes ventes que le bilan : ni
 * supprimées, ni de la caisse 1.
 */
export async function loadLiveBalance(): Promise<LiveBalance> {
  const [{ data }, allSales, allRefunds] = await Promise.all([
    loadBilanPdfData(),
    db.sales.toArray(),
    db.refunds.toArray(),
  ])
  const sales = allSales.filter(
    (s) => s.deletedAt == null && isReportedSaleRegister(s.incrementStart),
  )
  const refunds = allRefunds.filter(
    (r) => r.deletedAt == null && isReportedSaleRegister(r.incrementStart),
  )
  const expectedCash = add(
    sumOf(sales, (s) => s.cashAmount ?? 0),
    -sumOf(refunds, (r) => r.cashAmount),
  )

  let lastSale: LiveBalance['lastSale'] = null
  for (const sale of sales) {
    const at = toIsoString(sale.createdAt)
    if (at == null) continue
    if (lastSale == null || Date.parse(at) > Date.parse(lastSale.at)) {
      lastSale = { at, cashRegisterId: sale.incrementStart }
    }
  }

  const depositAverage = {
    particuliers: averageOf(data.deposits.particuliers),
    pros: averageOf(data.deposits.pros),
  }

  return { balance: data, expectedCash, depositAverage, lastSale }
}

function averageOf(figures: DepositTypeFigures): DepositAverage {
  const { fichesCount, totalAmount, articlesCount } = figures
  const perFiche = (n: number) => (fichesCount === 0 ? 0 : n / fichesCount)
  return { amount: perFiche(totalAmount), articles: perFiche(articlesCount) }
}
