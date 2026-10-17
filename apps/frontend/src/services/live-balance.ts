import type { BilanPdfData } from '@/pdf/bilan-pdf.tsx'
import { db, toIsoString } from '@/db.ts'
import {
  add,
  isReportedSaleRegister,
  loadBilanPdfData,
  sumOf,
} from '@/pdf/load-bilan-pdf-data.ts'

export type LiveBalance = {
  // Les chiffres du bilan, tels que le PDF les imprimerait à cet instant.
  balance: BilanPdfData
  // Les espèces que les caisses de vente devraient contenir d'après les
  // ventes, comme le théorique de leur contrôle : elles ne sont pas encore
  // comptées.
  expectedCash: number
  // La dernière vente arrivée dans la base de ce poste, et sa caisse.
  lastSale: { at: string; cashRegisterId: number } | null
}

/**
 * Ce que le suivi en direct affiche : le bilan du moment, plus les espèces
 * attendues et la dernière vente reçue. Mêmes ventes que le bilan : ni
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

  return { balance: data, expectedCash, lastSale }
}
