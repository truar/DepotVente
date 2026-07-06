import type {
  RecapRefundRow,
  RecapTransactionsRow,
  RecapVentesData,
  RecapVentesRow,
} from './recap-ventes-pdf'
import type { BilanAuditGroup } from './load-bilan-pdf-data'
import type {Sale} from '@/db';
import {  db } from '@/db'
import { getYear } from '@/utils'

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})
const numFmt = new Intl.NumberFormat('fr-FR')
const eur = (n: number) => eurFmt.format(n)
const num = (n: number) => numFmt.format(n)

export type RecapVentesResult = {
  data: RecapVentesData
  audit: Array<BilanAuditGroup>
}

const cashOf = (s: Sale) => (s.cashAmount ?? 0) + (s.deferredAmount ?? 0)

/**
 * "Récapitulatif des ventes" — sales grouped by cash register (incrementStart).
 *
 * Columns:
 *  - Chèques / Cartes         = Σ checkAmount / Σ cardAmount
 *  - Espèces                  = Σ (cashAmount + deferredAmount)   ← différé compté avec les espèces
 *  - Total                    = Chèques + Cartes + Espèces (brut, avant remboursement)
 *  - Remb.                    = Σ totalRefundAmount
 *  - Ventes                   = Total − Remb. (= Σ des ventes nettes)
 */
export async function loadRecapVentesPdfData(): Promise<RecapVentesResult> {
  const [allSales, allRefunds] = await Promise.all([
    db.sales.toArray(),
    db.refunds.toArray(),
  ])
  const sales = allSales.filter((s) => s.deletedAt == null)
  const refunds = allRefunds.filter((r) => r.deletedAt == null)

  const registerIds = Array.from(
    new Set(sales.map((s) => s.incrementStart)),
  ).sort((a, b) => a - b)

  const sales_: Array<RecapVentesRow> = []
  const transactions: Array<RecapTransactionsRow> = []
  for (const id of registerIds) {
    const registerSales = sales.filter((s) => s.incrementStart === id)
    const checks = registerSales.reduce((a, s) => a + (s.checkAmount ?? 0), 0)
    const cards = registerSales.reduce((a, s) => a + (s.cardAmount ?? 0), 0)
    const cash = registerSales.reduce((a, s) => a + cashOf(s), 0)
    const total = checks + cards + cash
    const refund = registerSales.reduce((a, s) => a + s.totalRefundAmount, 0)
    sales_.push({
      cashRegisterId: id,
      checks,
      cards,
      cash,
      total,
      refund,
      net: total - refund,
    })
    transactions.push({
      cashRegisterId: id,
      checks: registerSales.filter((s) => (s.checkAmount ?? 0) > 0).length,
      cash: registerSales.filter((s) => cashOf(s) > 0).length,
      cards: registerSales.filter((s) => (s.cardAmount ?? 0) > 0).length,
    })
  }

  const salesTotal = {
    checks: sales_.reduce((a, r) => a + r.checks, 0),
    cards: sales_.reduce((a, r) => a + r.cards, 0),
    cash: sales_.reduce((a, r) => a + r.cash, 0),
    total: sales_.reduce((a, r) => a + r.total, 0),
    refund: sales_.reduce((a, r) => a + r.refund, 0),
    net: sales_.reduce((a, r) => a + r.net, 0),
  }
  const transactionsTotal = {
    checks: transactions.reduce((a, r) => a + r.checks, 0),
    cash: transactions.reduce((a, r) => a + r.cash, 0),
    cards: transactions.reduce((a, r) => a + r.cards, 0),
  }

  // Remboursements: one line per refund record.
  const saleById = new Map(sales.map((s) => [s.id, s]))
  const refundRows: Array<RecapRefundRow> = refunds
    .map((r) => {
      const sale = saleById.get(r.saleId)
      return {
        cashRegisterId: sale?.incrementStart ?? r.incrementStart,
        saleIndex: sale?.saleIndex ?? 0,
        refundCash: r.cashAmount,
        refundCard: r.cardAmount,
        total: r.cashAmount + r.cardAmount,
      }
    })
    .sort(
      (a, b) =>
        a.cashRegisterId - b.cashRegisterId || a.saleIndex - b.saleIndex,
    )

  const data: RecapVentesData = {
    year: getYear(),
    sales: sales_,
    salesTotal,
    transactions,
    transactionsTotal,
    refunds: refundRows,
  }

  const audit: Array<BilanAuditGroup> = [
    {
      title: 'Récapitulatif des ventes — définition des colonnes',
      entries: [
        {
          label: 'Regroupement',
          value: `${num(registerIds.length)} caisses`,
          source: 'sales.incrementStart',
          formula: `caisses : ${registerIds.join(', ') || '—'}`,
        },
        {
          label: 'Chèques',
          value: eur(salesTotal.checks),
          source: 'Σ sale.checkAmount',
          formula: 'par caisse',
        },
        {
          label: 'Cartes',
          value: eur(salesTotal.cards),
          source: 'Σ sale.cardAmount',
          formula: 'par caisse',
        },
        {
          label: 'Espèces',
          value: eur(salesTotal.cash),
          source: 'Σ (sale.cashAmount + sale.deferredAmount)',
          formula: 'les paiements différés sont comptés avec les espèces',
        },
        {
          label: 'Total (brut)',
          value: eur(salesTotal.total),
          source: 'chèques + cartes + espèces',
          formula: `${eur(salesTotal.checks)} + ${eur(salesTotal.cards)} + ${eur(salesTotal.cash)}`,
        },
        {
          label: 'Remb.',
          value: eur(salesTotal.refund),
          source: 'Σ sale.totalRefundAmount',
          formula: 'par caisse',
        },
        {
          label: 'Ventes (net)',
          value: eur(salesTotal.net),
          source: 'total − remboursements',
          formula: `${eur(salesTotal.total)} − ${eur(salesTotal.refund)}`,
        },
      ],
    },
    {
      title: 'Nb de transactions — totaux',
      entries: [
        {
          label: 'Chèques',
          value: num(transactionsTotal.checks),
          source: 'nb ventes avec checkAmount > 0',
          formula: 'une vente mixte est comptée dans chaque moyen utilisé',
        },
        {
          label: 'Espèces',
          value: num(transactionsTotal.cash),
          source: 'nb ventes avec (cashAmount + deferredAmount) > 0',
          formula: 'idem colonne Espèces (différé inclus)',
        },
        {
          label: 'Cartes',
          value: num(transactionsTotal.cards),
          source: 'nb ventes avec cardAmount > 0',
          formula: '—',
        },
      ],
    },
    {
      title: 'Remboursements',
      entries: [
        {
          label: 'Nombre de remboursements',
          value: num(refundRows.length),
          source: 'refunds (non supprimés)',
          formula: 'une ligne par remboursement (caisse, n° vente, espèces, CB)',
        },
      ],
    },
  ]

  return { data, audit }
}
