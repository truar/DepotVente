import type {
  MaterialProCategoryRow,
  MaterialProData,
  MaterialProFiche,
} from './material-pro-pdf'
import type { BilanAuditGroup } from './load-bilan-pdf-data'
import type { Article } from '@/db'
import { db } from '@/db'
import { getYear } from '@/utils'
import { categories } from '@/types/categories'

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
const pctFmt = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const eur = (n: number) => eurFmt.format(n)
const pct = (n: number) => pctFmt.format(n)

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b)

export type MaterialProResult = {
  data: MaterialProData
  audit: Array<BilanAuditGroup>
}

/** Build the per-category breakdown for a single deposit's articles. */
function buildRows(depositArticles: Array<Article>): Array<MaterialProCategoryRow> {
  const byCategory = new Map<string, Array<Article>>()
  for (const a of depositArticles) {
    const key = a.category || 'Divers'
    const bucket = byCategory.get(key)
    if (bucket) bucket.push(a)
    else byCategory.set(key, [a])
  }

  // Canonical order first, then any unexpected categories seen in the data.
  const order = [
    ...categories,
    ...Array.from(byCategory.keys()).filter((c) => !categories.includes(c)),
  ]

  const rows: Array<MaterialProCategoryRow> = []
  for (const category of order) {
    const articles = byCategory.get(category)
    if (!articles || articles.length === 0) continue

    const prices = articles.map((a) => a.price)
    const depositAmount = prices.reduce((s, p) => s + p, 0)
    const sold = articles.filter((a) => a.status === 'SOLD')
    const soldPrices = sold.map((a) => a.price)
    const soldAmount = soldPrices.reduce((s, p) => s + p, 0)

    rows.push({
      category,
      depositCount: articles.length,
      depositAmount,
      depositMinPrice: Math.min(...prices),
      depositMaxPrice: Math.max(...prices),
      depositAvgPrice: safeDiv(depositAmount, articles.length),
      soldCount: sold.length,
      soldAmount,
      soldMinPrice: sold.length ? Math.min(...soldPrices) : 0,
      soldMaxPrice: sold.length ? Math.max(...soldPrices) : 0,
      soldRatio: safeDiv(sold.length, articles.length),
      soldAvgPrice: safeDiv(soldAmount, sold.length),
    })
  }
  return rows
}

/**
 * "Bilan matériel pro" — one page per PRO deposit (fiche), in one click.
 *
 * For each PRO deposit we break its articles down by category (Skis,
 * Chaussures, …) and, per category, report the deposit-side price stats
 * (count / total / min / max / average) alongside the sold-side stats and the
 * sell-through ratio. A per-fiche "Bilan global" sums it up.
 *
 * "En dépôt" = articles with status ≠ DELETED (sold ones included).
 * "Vendus"   = articles with status === SOLD.
 */
export async function loadMaterialProPdfData(): Promise<MaterialProResult> {
  const [allDeposits, allArticles, allContacts] = await Promise.all([
    db.deposits.toArray(),
    db.articles.toArray(),
    db.contacts.toArray(),
  ])

  const proDeposits = allDeposits
    .filter((d) => d.deletedAt == null && d.type === 'PRO')
    .sort((a, b) => a.depositIndex - b.depositIndex)

  const contactById = new Map(allContacts.map((c) => [c.id, c]))

  // deposit.id -> its non-deleted articles
  const articlesByDeposit = new Map<string, Array<Article>>()
  for (const a of allArticles) {
    if (a.deletedAt != null || a.status === 'DELETED') continue
    const bucket = articlesByDeposit.get(a.depositId)
    if (bucket) bucket.push(a)
    else articlesByDeposit.set(a.depositId, [a])
  }

  const fiches: Array<MaterialProFiche> = []
  const audit: Array<BilanAuditGroup> = []

  for (const deposit of proDeposits) {
    const depositArticles = articlesByDeposit.get(deposit.id) ?? []
    if (depositArticles.length === 0) continue

    const contact = contactById.get(deposit.sellerId)
    const sellerName = contact
      ? `${contact.lastName} ${contact.firstName}`.trim()
      : 'Vendeur inconnu'

    const rows = buildRows(depositArticles)

    const depositCount = rows.reduce((s, r) => s + r.depositCount, 0)
    const depositAmount = rows.reduce((s, r) => s + r.depositAmount, 0)
    const soldCount = rows.reduce((s, r) => s + r.soldCount, 0)
    const soldAmount = rows.reduce((s, r) => s + r.soldAmount, 0)
    const total = {
      depositCount,
      depositAmount,
      soldCount,
      soldAmount,
      soldRatio: safeDiv(soldCount, depositCount),
    }

    fiches.push({
      depositIndex: deposit.depositIndex,
      sellerName,
      rows,
      total,
    })

    audit.push({
      title: `Fiche N°${deposit.depositIndex} — ${sellerName}`,
      entries: [
        ...rows.map((r) => ({
          label: r.category,
          value: `${r.soldCount}/${r.depositCount}`,
          source: `articles du dépôt, catégorie « ${r.category} »`,
          formula: `dépôt ${eur(r.depositAmount)} (moy. ${eur(r.depositAvgPrice)}) · vendu ${eur(r.soldAmount)} · ${pct(r.soldRatio)}`,
        })),
        {
          label: 'Total dépôt',
          value: `${depositCount} art.`,
          source: 'Σ articles (status ≠ DELETED) du dépôt',
          formula: `${eur(depositAmount)} sur ${rows.length} catégorie(s)`,
        },
        {
          label: 'Total vendu',
          value: `${soldCount} art.`,
          source: 'Σ articles (status = SOLD) du dépôt',
          formula: `${eur(soldAmount)} vendus`,
        },
        {
          label: '% dépôt/vente',
          value: pct(total.soldRatio),
          source: 'articles vendus ÷ articles en dépôt',
          formula: `${soldCount} ÷ ${depositCount}`,
        },
      ],
    })
  }

  const data: MaterialProData = {
    year: getYear(),
    fiches,
  }

  return { data, audit }
}
