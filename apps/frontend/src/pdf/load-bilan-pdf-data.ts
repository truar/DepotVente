import type { BilanPdfData } from './bilan-pdf'
import type {Deposit, Sale} from '@/db';
import {   db } from '@/db'
import { fromCents, getYear, isClubBuyer, toCents } from '@/utils'

// Les montants s'additionnent en centimes entiers : 10,10 € + 20,20 € font
// 30,30 €, pas 30.299999999999997, et un bilan juste affiche 0,00 €, jamais
// « -0,00 € ».
const add = (...amounts: Array<number>) =>
  fromCents(amounts.reduce((a, amount) => a + toCents(amount), 0))
const sumOf = <T>(items: Array<T>, amount: (item: T) => number) =>
  add(...items.map(amount))

function computeSaleTotal(sale: Sale): number {
  return add(
    sale.cardAmount ?? 0,
    sale.cashAmount ?? 0,
    sale.checkAmount ?? 0,
    sale.deferredAmount ?? 0,
    -sale.totalRefundAmount,
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

  // "Articles en dépôt" = what was on sale: every article that is not
  // deleted (sold ones included), except a pro's articles never received —
  // they never reached the shop.
  const depositArticles = allArticles.filter(
    (a) =>
      a.deletedAt == null &&
      a.status !== 'DELETED' &&
      a.status !== 'RECEPTION_PENDING',
  )
  // A fiche without any article on sale (a pro whose articles never came)
  // is not a fiche of the bourse.
  const depositIdsWithArticles = new Set(
    depositArticles.map((a) => a.depositId),
  )
  const deposits = allDeposits.filter(
    (d) => d.deletedAt == null && depositIdsWithArticles.has(d.id),
  )
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
  const soldArticles = depositArticles.filter((a) => a.status === 'SOLD')

  // ===== Dépôts / pré-dépôts =====
  const fichesCount = deposits.length
  const confirmedPredeposits = predeposits.filter((p) => p.depositId != null)
  const predepositsCount = confirmedPredeposits.length
  const articlesCount = depositArticles.length
  const depositTotalAmount = sumOf(depositArticles, (x) => x.price)

  // Achats CMR: what the club bought back to make up for a theft.
  const cmrContactIds = new Set(
    allContacts.filter((c) => isClubBuyer(c)).map((c) => c.id),
  )
  const cmrPurchaseSales = sales.filter((s) => cmrContactIds.has(s.buyerId))
  const cmrPurchaseSaleIds = new Set(cmrPurchaseSales.map((s) => s.id))
  const cmrPurchases = sumOf(cmrPurchaseSales, computeSaleTotal)

  // ===== Ventes =====
  // Neither the club nor a buyer refunded in full (who took nothing home)
  // is a buyer of the bourse, nor counts in the average basket.
  const basketSales = sales.filter(
    (s) =>
      !cmrPurchaseSaleIds.has(s.id) &&
      computeSaleTotal(s) > 0,
  )
  const buyersCount = new Set(basketSales.map((s) => s.buyerId)).size
  const soldArticlesCount = soldArticles.length
  const salesTotalAmount = sumOf(sales, computeSaleTotal)
  const basketAmount = sumOf(basketSales, computeSaleTotal)
  const averageBasketAmount = safeDiv(basketAmount, buyersCount)
  const basketArticlesCount = soldArticles.filter(
    (a) => a.saleId == null || !cmrPurchaseSaleIds.has(a.saleId),
  ).length
  const averageBasketArticles = safeDiv(basketArticlesCount, buyersCount)
  const soldArticlesRatio = safeDiv(soldArticlesCount, articlesCount)
  const depositValueRatio = safeDiv(salesTotalAmount, depositTotalAmount)

  // ===== Cotisations et droits =====
  const paidContributionsPaye = sumOf(
    deposits.filter((d) => d.contributionStatus === 'PAYE'),
    (d) => d.contributionAmount,
  )
  // Cotisations réglées le soir au bureau des retours : elles ont bien été
  // payées, elles changent simplement de ligne (et de caisse), donc la recette
  // théorique reste inchangée quand un dépôt passe de A_PAYER à SOLDE.
  const settledDeposits = deposits.filter((d) => d.contributionStatus === 'SOLDE')
  const paidContributionsSolde = sumOf(
    settledDeposits,
    (d) => d.contributionAmount,
  )
  const unattributedSettled = settledDeposits.filter(
    (d) => d.contributionCollectWorkstationId == null,
  )
  const unattributedSettledAmount = sumOf(
    unattributedSettled,
    (d) => d.contributionAmount,
  )
  const deductedContributions = sumOf(
    deposits.filter((d) => d.contributionStatus === 'DEDUITE'),
    (d) => d.dueContributionAmount ?? 0,
  )
  const paidContributions = add(
    paidContributionsPaye,
    paidContributionsSolde,
    deductedContributions,
  )
  const unpaidContributions = sumOf(
    deposits.filter((d) => d.contributionStatus === 'A_PAYER'),
    (d) => d.contributionAmount,
  )
  const cmrRights = sumOf(deposits, (d) => d.clubAmount ?? 0)

  // La recette théorique : ce qui est dû à la bourse, soit les droits et
  // toutes les cotisations, payées ou non. Une cotisation restée impayée n'est
  // pas en caisse : elle reste dans l'écart avec la recette bourse. Les achats
  // CMR sont une perte pour la bourse : ils sortent des deux recettes.
  const theoreticalRevenue = add(
    cmrRights,
    paidContributions,
    unpaidContributions,
    -cmrPurchases,
  )

  // ===== Détail des encaissements =====
  // Mêmes définitions que le récap. ventes, pour que les deux rapports affichent
  // les mêmes totaux :
  //  - cartes  = Σ sale.cardAmount − Σ refund.cardAmount (remboursements CB seuls,
  //              les remboursements espèces sortent déjà du tiroir-caisse) ;
  //  - espèces = les espèces réellement comptées aux caisses de VENTE, pas le
  //              sale.cashAmount théorique (réconciliation théorique / réel).
  const saleRegisters = cashRegisterControls.filter((c) => c.type === 'SALE')
  const grossCards = sumOf(sales, (s) => s.cardAmount ?? 0)
  const refundedCards = sumOf(refunds, (r) => r.cardAmount)
  const totalCards = add(grossCards, -refundedCards)
  const totalCash = sumOf(saleRegisters, (c) => c.realCashAmount)
  const totalChecks = sumOf(sales, (s) => s.checkAmount ?? 0)
  const totalDeferred = sumOf(sales, (s) => s.deferredAmount ?? 0)
  // Ce qui est réellement entré : cartes, espèces comptées, chèques. Le
  // différé n'est encore ni en caisse ni sur un relevé : il n'entre pas dans
  // la recette bourse, il explique une part de l'écart (voir le solde).
  const totalPayments = add(totalCards, totalCash, totalChecks)

  // Cotisations encaissées = real cash counted in the deposit registers and in
  // the return registers (the cotisations settled in the evening).
  // Contributions deducted at return (DEDUITE) are NOT added here: they are
  // already netted out of deposit.sellerAmount, so they are accounted for by
  // the lower "montant total décaissé".
  const depositRegisters = cashRegisterControls.filter(
    (c) => c.type === 'DEPOSIT',
  )
  const returnRegisters = cashRegisterControls.filter(
    (c) => c.type === 'RETURN',
  )
  const depositRegisterRealCash = sumOf(
    depositRegisters,
    (c) => c.realCashAmount,
  )
  const returnRegisterRealCash = sumOf(
    returnRegisters,
    (c) => c.realCashAmount,
  )
  const collectedContributions = add(
    depositRegisterRealCash,
    returnRegisterRealCash,
  )

  // Les pros sont réputés réglés d'office : il n'existe pas d'étape de
  // règlement pro dans l'application (l'écran /returns/pros ne fait que
  // rescanner les articles), et le montant qui leur est dû part toujours. On
  // le décaisse donc dès que le calcul du retour l'a établi, sans attendre un
  // collectedAt qu'aucun écran ne pose.
  const proDeposits = deposits.filter((d) => d.type === 'PRO')
  const proPayments = sumOf(proDeposits, (d) =>
    Math.max(0, d.sellerAmount ?? 0),
  )
  // Les particuliers, eux, ne sont décaissés qu'une fois venus chercher leur
  // chèque (collectedAt posé par /returns/individuals).
  const isCollected = (d: Deposit) => d.collectedAt != null
  const individualPayments = sumOf(
    deposits.filter((d) => d.type === 'PARTICULIER' && isCollected(d)),
    (d) => Math.max(0, d.sellerAmount ?? 0),
  )
  const totalDisbursed = add(proPayments, individualPayments)
  const unmadeIndividualChecks = sumOf(
    deposits.filter(
      (d) =>
        d.type === 'PARTICULIER' &&
        d.checkId == null &&
        (d.sellerAmount ?? 0) > 0,
    ),
    (d) => d.sellerAmount ?? 0,
  )

  // Les chèques particuliers non faits sont dus aux vendeurs : l'argent est
  // encore en caisse mais il n'appartient pas à la bourse, donc il sort de la
  // recette réelle au même titre que ce qui a déjà été décaissé. Sans cela la
  // recette gonfle de tout ce qui reste à régler aux particuliers.
  const actualRevenue = add(
    totalPayments,
    collectedContributions,
    -totalDisbursed,
    -unmadeIndividualChecks,
    -cmrPurchases,
  )

  // Différence de caisses = les écarts constatés aux contrôles. Les contrôles
  // de caisse de retour sont comptés comme les autres : leurs espèces entrent
  // dans la recette réelle ci-dessus, donc leur écart explique bien un manque
  // ou un excédent réel. Les paiements différés et les cotisations non payées,
  // dus à la bourse mais pas encore encaissés, expliquent le reste de l'écart.
  // Le solde ne garde que ce qu'il reste à expliquer : 0 quand tout est
  // expliqué.
  const controlsDiff = sumOf(cashRegisterControls, (c) => c.difference)
  const cashRegisterDiff = controlsDiff
  const theoreticalVsActualDiff = add(actualRevenue, -theoreticalRevenue)
  const diffBalance = add(
    theoreticalVsActualDiff,
    -cashRegisterDiff,
    totalDeferred,
    unpaidContributions,
  )

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
          source:
            'deposits (non supprimés, avec au moins un article en dépôt)',
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
          source: 'articles (hors supprimés et articles pros non réceptionnés)',
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
          source:
            'buyerId distincts sur sales, hors ventes entièrement remboursées',
          formula: `${num(buyersCount)} buyerId distincts / ${num(basketSales.length)} ventes`,
        },
        {
          label: 'Panier moyen (€)',
          value: eur(averageBasketAmount),
          source: 'ventes des acheteurs ÷ nb acheteurs',
          formula: `${eur(basketAmount)} ÷ ${num(buyersCount)}`,
        },
        {
          label: 'Panier moyen (articles)',
          value: num(averageBasketArticles),
          source: 'articles vendus (hors achats CMR) ÷ nb acheteurs',
          formula: `${num(basketArticlesCount)} ÷ ${num(buyersCount)}`,
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
          source:
            'contributionAmount (PAYE + SOLDE) + dueContributionAmount (DEDUITE)',
          formula: `${eur(paidContributionsPaye)} (PAYE) + ${eur(paidContributionsSolde)} (SOLDE) + ${eur(deductedContributions)} (DEDUITE)`,
        },
        {
          label: 'Dont cotisations soldées au retour',
          value: eur(paidContributionsSolde),
          source: 'contributionAmount (SOLDE), encaissées le soir aux retours',
          formula: `${num(settledDeposits.length)} fiche(s) ; ${eur(unattributedSettledAmount)} sans caisse d'encaissement (${num(unattributedSettled.length)} fiche(s)), comptée(s) dans aucun théorique de caisse`,
        },
        {
          label: 'Cotisations non payées',
          value: eur(unpaidContributions),
          source: 'contributionAmount (A_PAYER)',
          formula: `Σ contributionAmount des dépôts A_PAYER, comptée dans la recette théorique — une cotisation soldée le soir passe en SOLDE et sort de cette ligne`,
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
          source: 'ventes dont acheteur = « CMR », sans droits CMR',
          formula: `Σ total sur ${num(cmrPurchaseSales.length)} vente(s) « CMR »`,
        },
        {
          label: 'Recette bourse théorique',
          value: eur(theoreticalRevenue),
          source:
            'cotisations payées (PAYE + SOLDE + DEDUITE) + cotisations non payées (A_PAYER) + droits CMR − achats CMR',
          formula: `${eur(paidContributions)} + ${eur(unpaidContributions)} + ${eur(cmrRights)} − ${eur(cmrPurchases)}`,
        },
      ],
    },
    {
      title: 'Détail des encaissements',
      entries: [
        {
          label: 'Total paiements',
          value: eur(totalPayments),
          source: 'cartes + espèces + chèques (sans le différé)',
          formula: `${eur(totalCards)} + ${eur(totalCash)} + ${eur(totalChecks)}`,
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
          source: 'Σ realCashAmount des caisses de dépôt et de retour (réel)',
          formula: `${eur(depositRegisterRealCash)} sur ${num(depositRegisters.length)} caisse(s) de dépôt + ${eur(returnRegisterRealCash)} sur ${num(returnRegisters.length)} caisse(s) de retour (hors DEDUITE, déjà déduites du sellerAmount)`,
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
            'total paiements + cotisations encaissées − décaissé − chèques particuliers non faits − achats CMR',
          formula: `${eur(totalPayments)} + ${eur(collectedContributions)} − ${eur(totalDisbursed)} − ${eur(unmadeIndividualChecks)} − ${eur(cmrPurchases)}`,
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
          source:
            'Σ cashRegisterControl.difference (dépôt + vente + retour)',
          formula: `${eur(controlsDiff)} (${num(cashRegisterControls.length)} caisses : ${num(depositRegisters.length)} dépôt, ${num(saleRegisters.length)} vente, ${num(returnRegisters.length)} retour)`,
        },
        {
          label: 'Paiements différés',
          value: eur(totalDeferred),
          source: 'Σ sale.deferredAmount — dus, pas encore encaissés',
          formula: `Σ deferredAmount sur ${num(sales.length)} ventes`,
        },
        {
          // Same amount as « Cotisations non payées » above; named apart so
          // the audit keeps one row per label.
          label: 'Cotisations non payées (différence)',
          value: eur(unpaidContributions),
          source:
            'contributionAmount (A_PAYER) — dues, dans la recette théorique, jamais encaissées',
          formula: `Σ contributionAmount des dépôts A_PAYER`,
        },
        {
          label: 'Solde différence',
          value: eur(diffBalance),
          source:
            'diff recette − différence de caisses + paiements différés + cotisations non payées',
          formula: `${eur(theoreticalVsActualDiff)} − ${eur(cashRegisterDiff)} + ${eur(totalDeferred)} + ${eur(unpaidContributions)}`,
        },
      ],
    },
  ]

  return { data, audit }
}
