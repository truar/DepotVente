import type { RecapDepotsData, RecapDepotsRow } from './recap-depots-pdf'
import type { BilanAuditGroup } from './load-bilan-pdf-data'
import { db } from '@/db'
import { getYear } from '@/utils'

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const numFmt = new Intl.NumberFormat('fr-FR')
const eur = (n: number) => eurFmt.format(n)
const num = (n: number) => numFmt.format(n)

// Une cotisation soldée le soir reste due par le dépôt, donc rattachée à sa
// caisse de dépôt ici — même si les espèces, elles, ont été comptées à la
// caisse de retour qui l'a encaissée.
const THEORETICAL_CONTRIBUTION_STATUSES = [
  'PAYE',
  'SOLDE',
  'DEDUITE',
  'A_PAYER',
]

export type RecapDepotsResult = {
  data: RecapDepotsData
  audit: Array<BilanAuditGroup>
}

/**
 * "Récapitulatifs dépôts/pré-dépôts".
 *
 * Table Dépôts — grouped by cash register (deposit.incrementStart; pros land in
 * caisse 1 via the import). Per caisse:
 *  - Nb Vendeurs   = nb de fiches de dépôt
 *  - Nb Pré-dépôts = nb de pré-dépôts confirmés dont le dépôt est sur cette caisse
 *  - Valeur dépôt  = Σ price des articles (status ≠ DELETED) des dépôts de la caisse
 *  - Nb Articles   = nb de ces articles
 *
 * Table Pré-dépôts — une ligne de synthèse sur l'ensemble des pré-dépôts.
 */
export async function loadRecapDepotsPdfData(): Promise<RecapDepotsResult> {
  const [allDeposits, allArticles, allPredeposits, allPredepositArticles] =
    await Promise.all([
      db.deposits.toArray(),
      db.articles.toArray(),
      db.predeposits.toArray(),
      db.predepositArticles.toArray(),
    ])

  const deposits = allDeposits.filter((d) => d.deletedAt == null)
  const predeposits = allPredeposits.filter((p) => p.deletedAt == null)
  const predepositArticles = allPredepositArticles.filter(
    (a) => a.deletedAt == null,
  )
  const depositArticles = allArticles.filter(
    (a) => a.deletedAt == null && a.status !== 'DELETED',
  )

  // deposit.id -> caisse (incrementStart)
  const depositCaisse = new Map(deposits.map((d) => [d.id, d.incrementStart]))

  // Confirmed pre-deposits counted against the caisse of their linked deposit.
  const confirmedPredepositsByCaisse = new Map<number, number>()
  for (const p of predeposits) {
    if (p.depositId == null) continue
    const caisse = depositCaisse.get(p.depositId)
    if (caisse == null) continue
    confirmedPredepositsByCaisse.set(
      caisse,
      (confirmedPredepositsByCaisse.get(caisse) ?? 0) + 1,
    )
  }

  // Articles aggregated by their deposit's caisse.
  const valueByCaisse = new Map<number, number>()
  const articlesByCaisse = new Map<number, number>()
  for (const a of depositArticles) {
    const caisse = depositCaisse.get(a.depositId)
    if (caisse == null) continue
    valueByCaisse.set(caisse, (valueByCaisse.get(caisse) ?? 0) + a.price)
    articlesByCaisse.set(caisse, (articlesByCaisse.get(caisse) ?? 0) + 1)
  }

  const registerIds = Array.from(
    new Set(deposits.map((d) => d.incrementStart)),
  ).sort((a, b) => a - b)

  const rows: Array<RecapDepotsRow> = registerIds.map((id) => {
    const caisseDeposits = deposits.filter((d) => d.incrementStart === id)
    const contribution = caisseDeposits
      .filter((d) =>
        THEORETICAL_CONTRIBUTION_STATUSES.includes(d.contributionStatus),
      )
      .reduce((acc, d) => acc + d.contributionAmount, 0)
    return {
      cashRegisterId: id,
      sellersCount: caisseDeposits.length,
      predepositsCount: confirmedPredepositsByCaisse.get(id) ?? 0,
      depositValue: valueByCaisse.get(id) ?? 0,
      articlesCount: articlesByCaisse.get(id) ?? 0,
      contribution,
    }
  })

  const depositsTotal = {
    sellersCount: rows.reduce((a, r) => a + r.sellersCount, 0),
    predepositsCount: rows.reduce((a, r) => a + r.predepositsCount, 0),
    depositValue: rows.reduce((a, r) => a + r.depositValue, 0),
    articlesCount: rows.reduce((a, r) => a + r.articlesCount, 0),
    contribution: rows.reduce((a, r) => a + r.contribution, 0),
  }

  const contributionByStatus = (status: string) =>
    deposits
      .filter((d) => d.contributionStatus === status)
      .reduce((acc, d) => acc + d.contributionAmount, 0)

  const confirmed = predeposits.filter((p) => p.depositId != null).length
  const predepositsSummary = {
    count: predeposits.length,
    articlesCount: predepositArticles.length,
    value: predepositArticles.reduce((a, x) => a + x.price, 0),
    notConfirmed: predeposits.length - confirmed,
    confirmed,
  }

  const data: RecapDepotsData = {
    year: getYear(),
    deposits: rows,
    depositsTotal,
    predeposits: predepositsSummary,
  }

  const audit: Array<BilanAuditGroup> = [
    {
      title: 'Dépôts — totaux (regroupés par caisse)',
      entries: [
        {
          label: 'Regroupement',
          value: `${num(registerIds.length)} caisses`,
          source: 'deposit.incrementStart',
          formula: `caisses : ${registerIds.join(', ') || '—'}`,
        },
        {
          label: 'Nb Vendeurs',
          value: num(depositsTotal.sellersCount),
          source: 'nb de fiches de dépôt (non supprimées)',
          formula: 'une fiche = un vendeur',
        },
        {
          label: 'Nb Pré-dépôts',
          value: num(depositsTotal.predepositsCount),
          source: 'pré-dépôts confirmés (depositId défini)',
          formula: 'rattachés à la caisse de leur dépôt',
        },
        {
          label: 'Valeur dépôt',
          value: eur(depositsTotal.depositValue),
          source: 'Σ article.price (status ≠ DELETED)',
          formula: 'articles rattachés au dépôt via depositId',
        },
        {
          label: 'Nb Articles',
          value: num(depositsTotal.articlesCount),
          source: 'nb articles (status ≠ DELETED)',
          formula: '—',
        },
        {
          label: 'Cotisation',
          value: eur(depositsTotal.contribution),
          source:
            'Σ contributionAmount des dépôts PAYE, SOLDE, DEDUITE ou A_PAYER',
          formula: `cotisations théoriques : ${eur(contributionByStatus('PAYE'))} payées + ${eur(contributionByStatus('SOLDE'))} soldées au retour + ${eur(contributionByStatus('DEDUITE'))} déduites + ${eur(contributionByStatus('A_PAYER'))} à payer`,
        },
      ],
    },
    {
      title: 'Pré-dépôts — synthèse',
      entries: [
        {
          label: 'Nb pré-dépôts',
          value: num(predepositsSummary.count),
          source: 'predeposits (non supprimés)',
          formula: `${num(predepositsSummary.confirmed)} confirmés + ${num(predepositsSummary.notConfirmed)} non confirmés`,
        },
        {
          label: 'Nb articles',
          value: num(predepositsSummary.articlesCount),
          source: 'predepositArticles (non supprimés)',
          formula: '—',
        },
        {
          label: 'Valeur pré-dépôt',
          value: eur(predepositsSummary.value),
          source: 'Σ predepositArticle.price',
          formula: '—',
        },
        {
          label: 'Nb non confirmés',
          value: num(predepositsSummary.notConfirmed),
          source: 'predeposits sans depositId',
          formula: '—',
        },
        {
          label: 'Nb confirmés',
          value: num(predepositsSummary.confirmed),
          source: 'predeposits avec depositId',
          formula: '—',
        },
      ],
    },
  ]

  return { data, audit }
}
