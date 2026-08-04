import type {
  RecapRefundRow,
  RecapTransactionsRow,
  RecapVentesData,
  RecapVentesRow,
} from './recap-ventes-pdf'
import type { BilanAuditGroup } from './load-bilan-pdf-data'
import type { Sale } from '@/db'
import { db } from '@/db'
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

const cashOf = (s: Sale) => s.cashAmount ?? 0
const deferredOf = (s: Sale) => s.deferredAmount ?? 0

/**
 * Le numéro de caisse est saisi à la main dans les réglages du poste : les
 * vraies caisses sont numérotées de 1000 en 1000 (le numéro sert de départ à
 * la numérotation des ventes). La caisse 1 est une saisie d'essai qui n'a
 * jamais servi — on l'exclut du rapport.
 */
const EXCLUDED_REGISTER_IDS = new Set([1])
const isReportedRegister = (id: number) => !EXCLUDED_REGISTER_IDS.has(id)

export async function loadRecapVentesPdfData(): Promise<RecapVentesResult> {
  const [allSales, allRefunds, allControls, allArticles] = await Promise.all([
    db.sales.toArray(),
    db.refunds.toArray(),
    db.cashRegisterControls.toArray(),
    db.articles.toArray(),
  ])
  const sales = allSales.filter(
    (s) => s.deletedAt == null && isReportedRegister(s.incrementStart),
  )
  const refunds = allRefunds.filter(
    (r) => r.deletedAt == null && isReportedRegister(r.incrementStart),
  )
  // espèces = les espèces comptées au contrôle, hors fond de caisse
  // (realCashAmount est déjà net du fond de caisse), pour que l'écart affiché
  // ici soit exactement la "Différence" du contrôle de caisse.
  const realCashByRegister = new Map(
    allControls
      .filter(
        (c) =>
          c.deletedAt == null &&
          c.type === 'SALE' &&
          isReportedRegister(c.cashRegisterId),
      )
      .map((c) => [c.cashRegisterId, c.realCashAmount]),
  )

  // Les articles sont rattachés à la caisse de leur vente. Retirer un article
  // d'une vente remet son saleId à null, donc ce total suit ce qui est
  // réellement reparti avec l'acheteur, remboursements déduits.
  const saleById = new Map(sales.map((s) => [s.id, s]))
  const soldByRegister = new Map<number, { amount: number; count: number }>()
  for (const a of allArticles) {
    if (a.deletedAt != null || a.status !== 'SOLD' || a.saleId == null) continue
    const sale = saleById.get(a.saleId)
    if (!sale) continue
    const acc = soldByRegister.get(sale.incrementStart) ?? {
      amount: 0,
      count: 0,
    }
    acc.amount += a.price
    acc.count += 1
    soldByRegister.set(sale.incrementStart, acc)
  }

  // Les remboursements sont rattachés à la caisse qui les a effectués, comme
  // le fait le contrôle de caisse — pas à celle de la vente d'origine.
  const refundByRegister = new Map<number, { cash: number; card: number }>()
  for (const r of refunds) {
    const acc = refundByRegister.get(r.incrementStart) ?? { cash: 0, card: 0 }
    acc.cash += r.cashAmount
    acc.card += r.cardAmount
    refundByRegister.set(r.incrementStart, acc)
  }

  // Toute caisse contrôlée ou ayant eu une activité mérite une ligne : une
  // caisse qui n'a fait que des remboursements (ils sont souvent encaissés
  // ailleurs que sur la caisse de la vente d'origine) doit apparaître, sinon
  // ses remboursements ne seraient déduits nulle part.
  const registerIds = Array.from(
    new Set([
      ...sales.map((s) => s.incrementStart),
      ...refunds.map((r) => r.incrementStart),
      ...realCashByRegister.keys(),
    ]),
  ).sort((a, b) => a - b)

  const sales_: Array<RecapVentesRow> = []
  const transactions: Array<RecapTransactionsRow> = []
  for (const id of registerIds) {
    const registerSales = sales.filter((s) => s.incrementStart === id)
    const registerRefunds = refundByRegister.get(id) ?? { cash: 0, card: 0 }
    const checks = registerSales.reduce((a, s) => a + (s.checkAmount ?? 0), 0)
    const cards =
      registerSales.reduce((a, s) => a + (s.cardAmount ?? 0), 0) -
      registerRefunds.card
    const cash = realCashByRegister.get(id) ?? 0
    const soldCash =
      registerSales.reduce((a, s) => a + cashOf(s), 0) - registerRefunds.cash
    const deferred = registerSales.reduce((a, s) => a + deferredOf(s), 0)
    const collected = checks + cards + cash + deferred
    const sold = checks + cards + soldCash + deferred
    sales_.push({
      cashRegisterId: id,
      checks,
      cards,
      cash,
      deferred,
      collected,
      sold,
      diff: collected - sold,
    })
    const sold_ = soldByRegister.get(id) ?? { amount: 0, count: 0 }
    transactions.push({
      cashRegisterId: id,
      soldAmount: sold_.amount,
      salesCount: registerSales.length,
      articlesCount: sold_.count,
      checks: registerSales.filter((s) => (s.checkAmount ?? 0) > 0).length,
      cash: registerSales.filter((s) => cashOf(s) > 0).length,
      deferred: registerSales.filter((s) => deferredOf(s) > 0).length,
      cards: registerSales.filter((s) => (s.cardAmount ?? 0) > 0).length,
    })
  }

  const salesTotal = {
    checks: sales_.reduce((a, r) => a + r.checks, 0),
    cards: sales_.reduce((a, r) => a + r.cards, 0),
    cash: sales_.reduce((a, r) => a + r.cash, 0),
    deferred: sales_.reduce((a, r) => a + r.deferred, 0),
    collected: sales_.reduce((a, r) => a + r.collected, 0),
    sold: sales_.reduce((a, r) => a + r.sold, 0),
    diff: sales_.reduce((a, r) => a + r.diff, 0),
  }
  // Détail des soustractions, pour l'audit uniquement. Toute caisse portant un
  // remboursement a sa ligne, donc rien n'échappe aux totaux ci-dessous.
  const grossCards = sales.reduce((a, s) => a + (s.cardAmount ?? 0), 0)
  const grossCash = sales.reduce((a, s) => a + cashOf(s), 0)
  const refundCardTotal = refunds.reduce((a, r) => a + r.cardAmount, 0)
  const refundCashTotal = refunds.reduce((a, r) => a + r.cashAmount, 0)
  const soldCashTotal = grossCash - refundCashTotal

  const transactionsTotal = {
    soldAmount: transactions.reduce((a, r) => a + r.soldAmount, 0),
    salesCount: transactions.reduce((a, r) => a + r.salesCount, 0),
    articlesCount: transactions.reduce((a, r) => a + r.articlesCount, 0),
    checks: transactions.reduce((a, r) => a + r.checks, 0),
    cash: transactions.reduce((a, r) => a + r.cash, 0),
    deferred: transactions.reduce((a, r) => a + r.deferred, 0),
    cards: transactions.reduce((a, r) => a + r.cards, 0),
  }

  // Remboursements: one line per refund record, rattachée — comme les colonnes
  // du tableau ci-dessus — à la caisse qui a effectué le remboursement.
  const refundRows: Array<RecapRefundRow> = refunds
    .map((r) => {
      const sale = saleById.get(r.saleId)
      return {
        cashRegisterId: r.incrementStart,
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

  const refundsTotal = {
    refundCard: refundRows.reduce((a, r) => a + r.refundCard, 0),
    refundCash: refundRows.reduce((a, r) => a + r.refundCash, 0),
    total: refundRows.reduce((a, r) => a + r.total, 0),
  }

  const data: RecapVentesData = {
    year: getYear(),
    sales: sales_,
    salesTotal,
    transactions,
    transactionsTotal,
    refunds: refundRows,
    refundsTotal,
  }

  const audit: Array<BilanAuditGroup> = [
    {
      title: 'Récapitulatif des encaissements — définition des colonnes',
      entries: [
        {
          label: 'Regroupement',
          value: `${num(registerIds.length)} caisses`,
          source: 'union : ventes, remboursements et contrôles de caisse SALE',
          formula: `caisses : ${registerIds.join(', ') || '—'} — exclue(s) : ${[...EXCLUDED_REGISTER_IDS].join(', ')}`,
        },
        {
          label: 'Chèques',
          value: eur(salesTotal.checks),
          source: 'Σ sale.checkAmount',
          formula: 'par caisse',
        },
        {
          label: 'Cartes (net)',
          value: eur(salesTotal.cards),
          source: 'Σ sale.cardAmount − Σ refund.cardAmount',
          formula: `${eur(grossCards)} − ${eur(refundCardTotal)}`,
        },
        {
          label: 'Espèces (réel en caisse)',
          value: eur(salesTotal.cash),
          source: 'contrôle de caisse SALE : realCashAmount',
          formula: `espèces comptées, hors fond de caisse — ${num(realCashByRegister.size)} caisse(s) contrôlée(s) sur ${num(registerIds.length)}`,
        },
        {
          label: 'Différé',
          value: eur(salesTotal.deferred),
          source: 'Σ sale.deferredAmount',
          formula: 'par caisse',
        },
        {
          label: 'Encaissé',
          value: eur(salesTotal.collected),
          source: 'cartes (net) + espèces comptées + différé + chèques',
          formula: `${eur(salesTotal.cards)} + ${eur(salesTotal.cash)} + ${eur(salesTotal.deferred)} + ${eur(salesTotal.checks)}`,
        },
        {
          label: 'Vendu',
          value: eur(salesTotal.sold),
          source: 'idem Encaissé, mais avec les espèces théoriques',
          formula: `${eur(salesTotal.cards)} + ${eur(soldCashTotal)} + ${eur(salesTotal.deferred)} + ${eur(salesTotal.checks)}`,
        },
        {
          label: 'Espèces théoriques (dans Vendu)',
          value: eur(soldCashTotal),
          source: 'Σ sale.cashAmount − Σ refund.cashAmount',
          formula: `${eur(grossCash)} − ${eur(refundCashTotal)}`,
        },
        {
          label: 'Diff',
          value: eur(salesTotal.diff),
          source: 'encaissé − vendu',
          formula: `${eur(salesTotal.collected)} − ${eur(salesTotal.sold)} — écart de caisse, doit correspondre à la "Différence" du contrôle`,
        },
      ],
    },
    {
      title: 'Récapitulatif des ventes',
      entries: [
        {
          label: 'Mt vente',
          value: eur(transactionsTotal.soldAmount),
          source: 'Σ article.price (status = SOLD) via article.saleId',
          formula: `rattaché à la caisse de la vente — retirer un article d'une vente remet son saleId à null, donc les remboursements en sont déjà déduits`,
        },
        {
          label: 'Nb vente',
          value: num(transactionsTotal.salesCount),
          source: 'nb ventes (non supprimées) par sale.incrementStart',
          formula: '—',
        },
        {
          label: 'Nb articles',
          value: num(transactionsTotal.articlesCount),
          source: 'nb articles (status = SOLD) via article.saleId',
          formula: '—',
        },
        {
          label: 'Chèques',
          value: num(transactionsTotal.checks),
          source: 'nb ventes avec checkAmount > 0',
          formula: 'une vente mixte est comptée dans chaque moyen utilisé',
        },
        {
          label: 'Espèces',
          value: num(transactionsTotal.cash),
          source: 'nb ventes avec cashAmount > 0',
          formula: '—',
        },
        {
          label: 'Différé',
          value: num(transactionsTotal.deferred),
          source: 'nb ventes avec deferredAmount > 0',
          formula: '—',
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
          formula:
            'une ligne par remboursement (caisse, n° vente, espèces, CB)',
        },
        {
          label: 'Déduits des colonnes Cartes / Vendu',
          value: `${eur(refundCardTotal)} / ${eur(refundCashTotal)}`,
          source: 'Σ refund.cardAmount / Σ refund.cashAmount',
          formula:
            'rattachés à refund.incrementStart (la caisse qui a remboursé)',
        },
      ],
    },
  ]

  return { data, audit }
}
