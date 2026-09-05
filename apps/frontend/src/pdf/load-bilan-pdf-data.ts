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

/**
 * Comme dans le récap. ventes : les vraies caisses de vente sont numérotées de
 * 1000 en 1000, la caisse 1 est une saisie d'essai qui n'a jamais servi. Elle
 * n'est exclue que côté vente — côté dépôt, la caisse 1 est légitime (les pros
 * y sont rattachés par l'import).
 */
const EXCLUDED_SALE_REGISTER_IDS = new Set([1])
const isReportedSaleRegister = (id: number) =>
  !EXCLUDED_SALE_REGISTER_IDS.has(id)

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
    allRefunds,
    allPredeposits,
    allContacts,
    allCashRegisterControls,
  ] = await Promise.all([
    db.deposits.toArray(),
    db.articles.toArray(),
    db.sales.toArray(),
    db.refunds.toArray(),
    db.predeposits.toArray(),
    db.contacts.toArray(),
    db.cashRegisterControls.toArray(),
  ])

  const deposits = allDeposits.filter((d) => d.deletedAt == null)
  const sales = allSales.filter(
    (s) => s.deletedAt == null && isReportedSaleRegister(s.incrementStart),
  )
  const refunds = allRefunds.filter(
    (r) => r.deletedAt == null && isReportedSaleRegister(r.incrementStart),
  )
  const excludedSalesCount = allSales.filter(
    (s) => s.deletedAt == null && !isReportedSaleRegister(s.incrementStart),
  ).length
  const predeposits = allPredeposits.filter((p) => p.deletedAt == null)
  const cashRegisterControls = allCashRegisterControls.filter(
    (c) =>
      c.deletedAt == null &&
      (c.type !== 'SALE' || isReportedSaleRegister(c.cashRegisterId)),
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

  // La recette théorique est ce qui est dû à la bourse : les cotisations non
  // payées y sont ajoutées (et non retranchées). Côté recette réelle elles
  // n'entrent pas du tout, donc l'écart entre les deux est le non encaissé.
  const theoreticalRevenue =
    cmrRights + paidContributions + unpaidContributions

  // ===== Détail des encaissements =====
  // Mêmes définitions que le récap. ventes, pour que les deux rapports affichent
  // les mêmes totaux :
  //  - cartes  = Σ sale.cardAmount − Σ refund.cardAmount (remboursements CB seuls,
  //              les remboursements espèces sortent déjà du tiroir-caisse) ;
  //  - espèces = les espèces réellement comptées aux caisses de VENTE, pas le
  //              sale.cashAmount théorique (réconciliation théorique / réel).
  const saleRegisters = cashRegisterControls.filter((c) => c.type === 'SALE')
  const grossCards = sales.reduce((a, s) => a + (s.cardAmount ?? 0), 0)
  const refundedCards = refunds.reduce((a, r) => a + r.cardAmount, 0)
  const totalCards = grossCards - refundedCards
  const totalCash = saleRegisters.reduce((a, c) => a + c.realCashAmount, 0)
  const totalChecks = sales.reduce((a, s) => a + (s.checkAmount ?? 0), 0)
  const totalDeferred = sales.reduce((a, s) => a + (s.deferredAmount ?? 0), 0)
  const totalPayments = totalCards + totalCash + totalChecks + totalDeferred

  // Cotisations encaissées = real cash counted in the deposit registers only.
  // Contributions deducted at return (DEDUITE) are NOT added here: they are
  // already netted out of deposit.sellerAmount, so they are accounted for by
  // the lower "montant total décaissé".
  const depositRegisters = cashRegisterControls.filter(
    (c) => c.type === 'DEPOSIT',
  )
  const depositRegisterRealCash = depositRegisters.reduce(
    (a, c) => a + c.realCashAmount,
    0,
  )
  const collectedContributions = depositRegisterRealCash

  // Les pros sont réputés réglés d'office : il n'existe pas d'étape de
  // règlement pro dans l'application (l'écran /returns/pros ne fait que
  // rescanner les articles), et le montant qui leur est dû part toujours. On
  // le décaisse donc dès que le calcul du retour l'a établi, sans attendre un
  // collectedAt qu'aucun écran ne pose.
  const proDeposits = deposits.filter((d) => d.type === 'PRO')
  const proPayments = proDeposits.reduce(
    (a, d) => a + Math.max(0, d.sellerAmount ?? 0),
    0,
  )
  // Les particuliers, eux, ne sont décaissés qu'une fois venus chercher leur
  // chèque (collectedAt posé par /returns/individuals).
  const isCollected = (d: Deposit) => d.collectedAt != null
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

  // Les chèques particuliers non faits sont dus aux vendeurs : l'argent est
  // encore en caisse mais il n'appartient pas à la bourse, donc il sort de la
  // recette réelle au même titre que ce qui a déjà été décaissé. Sans cela la
  // recette gonfle de tout ce qui reste à régler aux particuliers.
  const actualRevenue =
    totalPayments + collectedContributions - totalDisbursed -
    unmadeIndividualChecks

  // Différence de caisses = les écarts constatés aux contrôles, + le différé.
  // Le contrôle de caisse ne voit pas le différé (son théorique ne compte que
  // les espèces), alors que "Total paiements" le compte comme encaissé : c'est
  // donc un écart connu de plus, à mettre au même endroit que les écarts de
  // comptage pour que le solde ci-dessous ne garde que l'inexpliqué.
  const controlsDiff = cashRegisterControls.reduce(
    (a, c) => a + c.difference,
    0,
  )
  const cashRegisterDiff = controlsDiff + totalDeferred
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
      totalDisbursed,
      totalCards,
      totalCash,
      totalChecks,
      totalDeferred,
      totalPayments,
      proPayments,
      individualPayments,
      collectedContributions,
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
          label: 'Périmètre des caisses de vente',
          value: `${num(excludedSalesCount)} vente(s) exclue(s)`,
          source: 'ventes, remboursements et contrôles de caisse VENTE',
          formula: `caisse(s) exclue(s) : ${[...EXCLUDED_SALE_REGISTER_IDS].join(', ')} (saisie d'essai, comme au récap. ventes) — les caisses de dépôt ne sont pas filtrées`,
        },
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
          source: 'droits CMR + cotisations payées + non payées',
          formula: `${eur(cmrRights)} + ${eur(paidContributions)} + ${eur(unpaidContributions)}`,
        },
      ],
    },
    {
      title: 'Détail des encaissements',
      entries: [
        {
          label: 'Total paiements',
          value: eur(totalPayments),
          source: 'cartes + espèces + chèques + différé',
          formula: `${eur(totalCards)} + ${eur(totalCash)} + ${eur(totalChecks)} + ${eur(totalDeferred)}`,
        },
        {
          label: 'Total cartes',
          value: eur(totalCards),
          source: 'Σ sale.cardAmount − Σ refund.cardAmount (CB uniquement)',
          formula: `${eur(grossCards)} − ${eur(refundedCards)} (${num(refunds.length)} remb.)`,
        },
        {
          label: 'Total espèces',
          value: eur(totalCash),
          source: 'contrôles de caisse VENTE : Σ realCashAmount',
          formula: `espèces comptées, hors fond de caisse — ${num(saleRegisters.length)} caisse(s) de vente`,
        },
        {
          label: 'Total chèques',
          value: eur(totalChecks),
          source: 'Σ sale.checkAmount',
          formula: `Σ checkAmount sur ${num(sales.length)} ventes`,
        },
        {
          label: 'Total différé',
          value: eur(totalDeferred),
          source: 'Σ sale.deferredAmount',
          formula: `Σ deferredAmount sur ${num(sales.length)} ventes`,
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
          source: 'Σ sellerAmount (PRO) — réglés d’office',
          formula: `Σ sellerAmount sur ${num(proDeposits.length)} dépôt(s) pro`,
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
          source: 'Σ realCashAmount des caisses de dépôt (réel)',
          formula: `${eur(depositRegisterRealCash)} sur ${num(depositRegisters.length)} caisse(s) de dépôt (hors DEDUITE, déjà déduites du sellerAmount)`,
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
          source:
            'total paiements + cotisations encaissées − décaissé − chèques particuliers non faits',
          formula: `${eur(totalPayments)} + ${eur(collectedContributions)} − ${eur(totalDisbursed)} − ${eur(unmadeIndividualChecks)}`,
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
          source: 'Σ cashRegisterControl.difference + total différé',
          formula: `${eur(controlsDiff)} (${num(cashRegisterControls.length)} caisses) + ${eur(totalDeferred)} (différé, invisible au contrôle de caisse)`,
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
