import type { BilanPdfData } from './bilan-pdf'
import type {Deposit, Sale} from '@/db';
import {   db } from '@/db'
import { getYear } from '@/utils'

function computeSaleTotal(sale: Sale): number {
  return (
    (sale.cardAmount ?? 0) +
    (sale.cashAmount ?? 0) +
    (sale.checkAmount ?? 0) +
    (sale.deferredAmount ?? 0) -
    sale.totalRefundAmount
  )
}

const safeDiv = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator

// --- French display formatters, used only to make the audit trail readable ---
const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})
const pctFmt = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const numFmt = new Intl.NumberFormat('fr-FR')
const eur = (n: number) => eurFmt.format(n)
const pct = (n: number) => pctFmt.format(n)
const num = (n: number) => numFmt.format(n)

/**
 * One reviewable line: the field as shown on the report, its computed value,
 * and the formula with the actual operands substituted in, so a human can
 * check every figure without reading the code.
 */
export type BilanAuditEntry = {
  label: string
  value: string
  /** Where the raw inputs come from (tables / statuses / fields). */
  source: string
  /** The arithmetic with real numbers plugged in. */
  formula: string
}
export type BilanAuditGroup = {
  title: string
  entries: Array<BilanAuditEntry>
}
export type BilanResult = {
  data: BilanPdfData
  audit: Array<BilanAuditGroup>
}

/**
 * Aggregates the whole IndexedDB dataset into the "Bilan de la bourse" report.
 * This is a theoretical (what is persisted in the DB) vs real (what is counted
 * in the cash registers) reconciliation across ALL cash registers.
 *
 * Every field is mirrored into an `audit` trail so the derivation of each
 * displayed number stays reviewable by a human.
 */
export async function loadBilanPdfData(): Promise<BilanResult> {
  const [
    allDeposits,
    allArticles,
    allSales,
    allPredeposits,
    allContacts,
    allCashRegisterControls,
  ] = await Promise.all([
    db.deposits.toArray(),
    db.articles.toArray(),
    db.sales.toArray(),
    db.predeposits.toArray(),
    db.contacts.toArray(),
    db.cashRegisterControls.toArray(),
  ])

  const deposits = allDeposits.filter((d) => d.deletedAt == null)
  const sales = allSales.filter((s) => s.deletedAt == null)
  const predeposits = allPredeposits.filter((p) => p.deletedAt == null)
  const cashRegisterControls = allCashRegisterControls.filter(
    (c) => c.deletedAt == null,
  )
  // "Articles en dépôt" = every article that is not deleted (sold ones included).
  const depositArticles = allArticles.filter(
    (a) => a.deletedAt == null && a.status !== 'DELETED',
  )
  const soldArticles = depositArticles.filter((a) => a.status === 'SOLD')

  // ===== Dépôts / pré-dépôts =====
  const fichesCount = deposits.length
  const confirmedPredeposits = predeposits.filter((p) => p.depositId != null)
  const predepositsCount = confirmedPredeposits.length
  const articlesCount = depositArticles.length
  const depositTotalAmount = depositArticles.reduce((a, x) => a + x.price, 0)

  // ===== Ventes =====
  const buyersCount = new Set(sales.map((s) => s.buyerId)).size
  const soldArticlesCount = soldArticles.length
  const salesTotalAmount = sales.reduce((a, s) => a + computeSaleTotal(s), 0)
  const averageBasketAmount = safeDiv(salesTotalAmount, buyersCount)
  const averageBasketArticles = safeDiv(soldArticlesCount, buyersCount)
  const soldArticlesRatio = safeDiv(soldArticlesCount, articlesCount)
  const depositValueRatio = safeDiv(salesTotalAmount, depositTotalAmount)

  // ===== Cotisations et droits =====
  const paidContributionsPaye = deposits
    .filter((d) => d.contributionStatus === 'PAYE')
    .reduce((a, d) => a + d.contributionAmount, 0)
  const deductedContributions = deposits
    .filter((d) => d.contributionStatus === 'DEDUITE')
    .reduce((a, d) => a + (d.dueContributionAmount ?? 0), 0)
  const paidContributions = paidContributionsPaye + deductedContributions
  const unpaidContributions = deposits
    .filter((d) => d.contributionStatus === 'A_PAYER')
    .reduce((a, d) => a + d.contributionAmount, 0)
  const cmrRights = deposits.reduce((a, d) => a + (d.clubAmount ?? 0), 0)

  // Achats CMR: sales whose buyer's last name is "CMR".
  const cmrContactIds = new Set(
    allContacts
      .filter((c) => c.lastName.trim().toUpperCase() === 'CMR')
      .map((c) => c.id),
  )
  const cmrPurchaseSales = sales.filter((s) => cmrContactIds.has(s.buyerId))
  const cmrPurchases = cmrPurchaseSales.reduce(
    (a, s) => a + computeSaleTotal(s),
    0,
  )

  const theoreticalRevenue =
    cmrRights + paidContributions - unpaidContributions

  // ===== Détail des encaissements =====
  // Espèces = real cash actually counted in every register (deposit + sale),
  // not the persisted sale.cashAmount, per the theoretical-vs-real reconciliation.
  const totalChecks = sales.reduce((a, s) => a + (s.checkAmount ?? 0), 0)
  const totalCash = cashRegisterControls.reduce(
    (a, c) => a + c.realCashAmount,
    0,
  )
  const totalCards = sales.reduce((a, s) => a + (s.cardAmount ?? 0), 0)
  const totalPayments = totalChecks + totalCash + totalCards
  const soldMinusCollected = salesTotalAmount - totalPayments

  // Cotisations encaissées = real cash counted in the deposit registers
  // + contributions deducted from seller payouts at return (DEDUITE).
  const depositRegisters = cashRegisterControls.filter(
    (c) => c.type === 'DEPOSIT',
  )
  const depositRegisterRealCash = depositRegisters.reduce(
    (a, c) => a + c.realCashAmount,
    0,
  )
  const collectedContributions = depositRegisterRealCash + deductedContributions
  const contributionsToCollect = unpaidContributions

  // Return-phase payouts (all 0 until sellers come back to collect).
  const isCollected = (d: Deposit) => d.collectedAt != null
  const proPayments = deposits
    .filter((d) => d.type === 'PRO' && isCollected(d))
    .reduce((a, d) => a + Math.max(0, d.sellerAmount ?? 0), 0)
  const individualPayments = deposits
    .filter((d) => d.type === 'PARTICULIER' && isCollected(d))
    .reduce((a, d) => a + Math.max(0, d.sellerAmount ?? 0), 0)
  const totalDisbursed = proPayments + individualPayments
  const unmadeIndividualChecks = deposits
    .filter(
      (d) =>
        d.type === 'PARTICULIER' &&
        d.checkId == null &&
        (d.sellerAmount ?? 0) > 0,
    )
    .reduce((a, d) => a + (d.sellerAmount ?? 0), 0)

  const actualRevenue =
    totalPayments +
    (collectedContributions - contributionsToCollect) -
    totalDisbursed

  // Différence de caisses = Σ cashRegisterControl.difference across every register.
  const cashRegisterDiff = cashRegisterControls.reduce(
    (a, c) => a + c.difference,
    0,
  )
  const theoreticalVsActualDiff = actualRevenue - theoreticalRevenue
  const diffBalance = theoreticalVsActualDiff - cashRegisterDiff

  const data: BilanPdfData = {
    year: getYear(),
    deposits: {
      fichesCount,
      predepositsCount,
      articlesCount,
      totalAmount: depositTotalAmount,
    },
    sales: {
      buyersCount,
      averageBasketAmount,
      averageBasketArticles,
      soldArticlesCount,
      soldArticlesRatio,
      totalAmount: salesTotalAmount,
      depositValueRatio,
    },
    rights: {
      paidContributions,
      unpaidContributions,
      cmrRights,
      cmrPurchases,
      theoreticalRevenue,
    },
    collection: {
      totalSold: salesTotalAmount,
      totalDisbursed,
      totalChecks,
      totalCash,
      totalCards,
      totalPayments,
      soldMinusCollected,
      proPayments,
      individualPayments,
      collectedContributions,
      contributionsToCollect,
      unmadeIndividualChecks,
      actualRevenue,
      theoreticalVsActualDiff,
      cashRegisterDiff,
      diffBalance,
    },
  }

  const audit: Array<BilanAuditGroup> = [
    {
      title: 'Dépôts / pré-dépôts',
      entries: [
        {
          label: 'Nombre de fiches',
          value: num(fichesCount),
          source: 'deposits (non supprimés)',
          formula: `${num(fichesCount)} fiches de dépôt`,
        },
        {
          label: 'Dont pré-dépôts',
          value: num(predepositsCount),
          source: 'predeposits avec depositId (confirmés)',
          formula: `${num(predepositsCount)} confirmés / ${num(predeposits.length)} pré-dépôts`,
        },
        {
          label: "Nombre d'articles en dépôt",
          value: num(articlesCount),
          source: 'articles (status ≠ DELETED)',
          formula: `${num(articlesCount)} articles`,
        },
        {
          label: 'Montant du dépôt',
          value: eur(depositTotalAmount),
          source: 'Σ article.price',
          formula: `Σ price sur ${num(articlesCount)} articles`,
        },
      ],
    },
    {
      title: 'Ventes',
      entries: [
        {
          label: "Nombre d'acheteurs",
          value: num(buyersCount),
          source: 'buyerId distincts sur sales',
          formula: `${num(buyersCount)} buyerId distincts / ${num(sales.length)} ventes`,
        },
        {
          label: 'Panier moyen (€)',
          value: eur(averageBasketAmount),
          source: 'total ventes ÷ nb acheteurs',
          formula: `${eur(salesTotalAmount)} ÷ ${num(buyersCount)}`,
        },
        {
          label: 'Panier moyen (articles)',
          value: num(averageBasketArticles),
          source: 'articles vendus ÷ nb acheteurs',
          formula: `${num(soldArticlesCount)} ÷ ${num(buyersCount)}`,
        },
        {
          label: "Nombre d'articles vendus",
          value: num(soldArticlesCount),
          source: 'articles (status = SOLD)',
          formula: `${num(soldArticlesCount)} articles vendus`,
        },
        {
          label: '% des articles en dépôt',
          value: pct(soldArticlesRatio),
          source: 'articles vendus ÷ articles en dépôt',
          formula: `${num(soldArticlesCount)} ÷ ${num(articlesCount)}`,
        },
        {
          label: 'Montant total des ventes',
          value: eur(salesTotalAmount),
          source: 'Σ (carte+espèces+chèque+différé−remb.)',
          formula: `Σ total sur ${num(sales.length)} ventes`,
        },
        {
          label: '% de la valeur du dépôt',
          value: pct(depositValueRatio),
          source: 'total ventes ÷ montant du dépôt',
          formula: `${eur(salesTotalAmount)} ÷ ${eur(depositTotalAmount)}`,
        },
      ],
    },
    {
      title: 'Cotisations et droits',
      entries: [
        {
          label: 'Cotisations payées',
          value: eur(paidContributions),
          source: 'contributionAmount (PAYE) + dueContributionAmount (DEDUITE)',
          formula: `${eur(paidContributionsPaye)} (PAYE) + ${eur(deductedContributions)} (DEDUITE)`,
        },
        {
          label: 'Cotisations non payées',
          value: eur(unpaidContributions),
          source: 'contributionAmount (A_PAYER)',
          formula: `Σ contributionAmount des dépôts A_PAYER`,
        },
        {
          label: 'Droits CMR',
          value: eur(cmrRights),
          source: 'Σ deposit.clubAmount (10% part. / 15% pro du vendu)',
          formula: `Σ clubAmount sur ${num(fichesCount)} dépôts`,
        },
        {
          label: 'Achats CMR',
          value: eur(cmrPurchases),
          source: 'ventes dont acheteur = « CMR »',
          formula: `Σ total sur ${num(cmrPurchaseSales.length)} vente(s) « CMR »`,
        },
        {
          label: 'Recette bourse théorique',
          value: eur(theoreticalRevenue),
          source: 'droits CMR + cotisations payées − non payées',
          formula: `${eur(cmrRights)} + ${eur(paidContributions)} − ${eur(unpaidContributions)}`,
        },
      ],
    },
    {
      title: 'Détail des encaissements',
      entries: [
        {
          label: 'Montant total vendu',
          value: eur(salesTotalAmount),
          source: 'Σ total des ventes',
          formula: `identique au montant total des ventes`,
        },
        {
          label: 'Total chèques',
          value: eur(totalChecks),
          source: 'Σ sale.checkAmount',
          formula: `Σ checkAmount sur ${num(sales.length)} ventes`,
        },
        {
          label: 'Total espèces',
          value: eur(totalCash),
          source: 'Σ realCashAmount de toutes les caisses (dépôt + ventes)',
          formula: `Σ realCashAmount sur ${num(cashRegisterControls.length)} caisses`,
        },
        {
          label: 'Total cartes',
          value: eur(totalCards),
          source: 'Σ sale.cardAmount',
          formula: `Σ cardAmount sur ${num(sales.length)} ventes`,
        },
        {
          label: 'Total paiements',
          value: eur(totalPayments),
          source: 'chèques + espèces + cartes',
          formula: `${eur(totalChecks)} + ${eur(totalCash)} + ${eur(totalCards)}`,
        },
        {
          label: 'Diff vendu − encaissé',
          value: eur(soldMinusCollected),
          source: 'total vendu − total paiements',
          formula: `${eur(salesTotalAmount)} − ${eur(totalPayments)}`,
        },
        {
          label: 'Montant total décaissé',
          value: eur(totalDisbursed),
          source: 'règlements pros + particuliers (dépôts collectés)',
          formula: `${eur(proPayments)} (pros) + ${eur(individualPayments)} (part.)`,
        },
        {
          label: 'Règlements pros',
          value: eur(proPayments),
          source: 'Σ sellerAmount (PRO, collecté)',
          formula: `Σ sellerAmount des dépôts pros collectés`,
        },
        {
          label: 'Règlements particuliers',
          value: eur(individualPayments),
          source: 'Σ sellerAmount (PARTICULIER, collecté)',
          formula: `Σ sellerAmount des dépôts particuliers collectés`,
        },
        {
          label: 'Cotisations encaissées',
          value: eur(collectedContributions),
          source: 'caisses dépôt (réel) + cotisations DEDUITE',
          formula: `${eur(depositRegisterRealCash)} (${num(depositRegisters.length)} caisses) + ${eur(deductedContributions)} (DEDUITE)`,
        },
        {
          label: 'Cotisations à encaisser',
          value: eur(contributionsToCollect),
          source: '= cotisations non payées',
          formula: `${eur(unpaidContributions)}`,
        },
        {
          label: 'Chèques particuliers non faits',
          value: eur(unmadeIndividualChecks),
          source: 'Σ sellerAmount (PARTICULIER, sans chèque)',
          formula: `Σ sellerAmount dus sans chèque émis`,
        },
        {
          label: 'Recette bourse',
          value: eur(actualRevenue),
          source: 'total paiements + (encaissées − à encaisser) − décaissé',
          formula: `${eur(totalPayments)} + (${eur(collectedContributions)} − ${eur(contributionsToCollect)}) − ${eur(totalDisbursed)}`,
        },
        {
          label: 'Différence recette théorique et réelle',
          value: eur(theoreticalVsActualDiff),
          source: 'recette réelle − recette théorique',
          formula: `${eur(actualRevenue)} − ${eur(theoreticalRevenue)}`,
        },
        {
          label: 'Différence de caisses',
          value: eur(cashRegisterDiff),
          source: 'Σ cashRegisterControl.difference',
          formula: `Σ difference sur ${num(cashRegisterControls.length)} caisses`,
        },
        {
          label: 'Solde différence',
          value: eur(diffBalance),
          source: 'diff recette − différence de caisses',
          formula: `${eur(theoreticalVsActualDiff)} − ${eur(cashRegisterDiff)}`,
        },
      ],
    },
  ]

  return { data, audit }
}
