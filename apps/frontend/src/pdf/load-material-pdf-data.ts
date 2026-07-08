import type {
  MaterialCategoryBlock,
  MaterialData,
  MaterialDisciplineRow,
} from './material-pdf'
import type { BilanAuditGroup } from './load-bilan-pdf-data'
import type { Article, Deposit } from '@/db'
import { db } from '@/db'
import { getYear } from '@/utils'
import { categories } from '@/types/categories'
import { disciplines } from '@/types/disciplines'

const pctFmt = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const timestampFmt = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'short',
  timeStyle: 'medium',
})
const numFmt = new Intl.NumberFormat('fr-FR')
const pct = (n: number) => pctFmt.format(n)
const num = (n: number) => numFmt.format(n)

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b)

/**
 * Categories left out of the material report entirely — not listed and not
 * counted in the totals. "Zabsent" / "Zrefusé" are absent/refused items (never
 * really deposited); "Snow Blade" / "Luge" are no longer sold.
 */
const HIDDEN_CATEGORIES = new Set(['Snow Blade', 'Luge', 'Zabsent', 'Zrefusé'])

export type MaterialResult = {
  data: MaterialData
  audit: Array<BilanAuditGroup>
}

/**
 * "Bilan matériel" — global material breakdown for the whole bourse.
 *
 * Every non-deleted article is grouped by category (Skis, Chaussures, …); each
 * category shows its total "en dépôt" (status ≠ DELETED) vs "vendu"
 * (status = SOLD) counts and the sell-through ratio, broken down by discipline
 * (the app's disciplines: Alpin, Fond, Rando Alpine, …). A final split reports
 * pro vs particulier volumes.
 *
 * NB: the legacy Excel version listed hardware sub-labels (Parabolique, Droit,
 * télescopiques, …) that don't exist in the data model — those are replaced by
 * the actual disciplines carried on each article.
 */
export async function loadMaterialPdfData(): Promise<MaterialResult> {
  const [allArticles, allDeposits] = await Promise.all([
    db.articles.toArray(),
    db.deposits.toArray(),
  ])

  const articles = allArticles.filter(
    (a) =>
      a.deletedAt == null &&
      a.status !== 'DELETED' &&
      !HIDDEN_CATEGORIES.has(a.category || ''),
  )

  // deposit.id -> type (PRO / PARTICULIER), for the bottom split.
  const depositType = new Map<string, Deposit['type']>(
    allDeposits
      .filter((d) => d.deletedAt == null)
      .map((d) => [d.id, d.type]),
  )

  const isSold = (a: Article) => a.status === 'SOLD'

  // Canonical category order first, then any stray categories seen in the data.
  const presentCategories = new Set(articles.map((a) => a.category || 'Divers'))
  const categoryOrder = [
    ...categories.filter((c) => presentCategories.has(c)),
    ...Array.from(presentCategories).filter((c) => !categories.includes(c)),
  ]

  const blocks: Array<MaterialCategoryBlock> = categoryOrder.map((category) => {
    const catArticles = articles.filter((a) => (a.category || 'Divers') === category)
    const depositCount = catArticles.length
    const soldCount = catArticles.filter(isSold).length

    // Discipline breakdown: canonical disciplines present, then stray values.
    const presentDisc = new Set(catArticles.map((a) => a.discipline).filter(Boolean))
    const discOrder = [
      ...disciplines.filter((d) => presentDisc.has(d)),
      ...Array.from(presentDisc).filter((d) => !disciplines.includes(d)),
    ]
    const disciplineRows: Array<MaterialDisciplineRow> = discOrder.map((discipline) => {
      const discArticles = catArticles.filter((a) => a.discipline === discipline)
      return {
        discipline,
        depositCount: discArticles.length,
        soldCount: discArticles.filter(isSold).length,
      }
    })

    return {
      category,
      depositCount,
      soldCount,
      soldRatio: safeDiv(soldCount, depositCount),
      disciplines: disciplineRows,
    }
  })

  const totalDeposit = articles.length
  const totalSold = articles.filter(isSold).length

  const buildSplit = (label: string, type: Deposit['type']) => {
    const typeArticles = articles.filter((a) => depositType.get(a.depositId) === type)
    const depositCount = typeArticles.length
    const soldCount = typeArticles.filter(isSold).length
    return {
      label,
      depositCount,
      depositShare: safeDiv(depositCount, totalDeposit),
      soldCount,
      soldRatio: safeDiv(soldCount, depositCount),
    }
  }

  const splits = [
    // "Professionels" (single n) matches the wording on the legacy report.
    buildSplit('Professionels', 'PRO'),
    buildSplit('Particuliers', 'PARTICULIER'),
  ]

  const data: MaterialData = {
    year: getYear(),
    categories: blocks,
    totalDeposit,
    totalSold,
    totalRatio: safeDiv(totalSold, totalDeposit),
    splits,
    timestamp: timestampFmt.format(new Date()),
  }

  const audit: Array<BilanAuditGroup> = [
    {
      title: 'Bilan matériel — par catégorie',
      entries: blocks.map((b) => ({
        label: b.category,
        value: `${num(b.soldCount)}/${num(b.depositCount)}`,
        source: 'articles (status ≠ DELETED) / vendus (SOLD), par catégorie',
        formula:
          b.disciplines.length > 0
            ? `${pct(b.soldRatio)} — ${b.disciplines
                .map((d) => `${d.discipline} ${d.soldCount}/${d.depositCount}`)
                .join(', ')}`
            : `${pct(b.soldRatio)}`,
      })),
    },
    {
      title: 'Totaux',
      entries: [
        {
          label: 'Total articles en dépôt',
          value: num(totalDeposit),
          source: 'articles (status ≠ DELETED)',
          formula: `Σ sur ${num(blocks.length)} catégories`,
        },
        {
          label: 'Total articles vendus',
          value: num(totalSold),
          source: 'articles (status = SOLD)',
          formula: '—',
        },
        {
          label: '% vendus/dépôt',
          value: pct(data.totalRatio),
          source: 'total vendus ÷ total dépôt',
          formula: `${num(totalSold)} ÷ ${num(totalDeposit)}`,
        },
      ],
    },
    {
      title: 'Répartition pro / particulier',
      entries: splits.flatMap((s) => [
        {
          label: `${s.label} — dépôt`,
          value: `${num(s.depositCount)} (${pct(s.depositShare)})`,
          source: 'articles dont le dépôt est de ce type',
          formula: `${num(s.depositCount)} ÷ ${num(totalDeposit)}`,
        },
        {
          label: `${s.label} — vendus`,
          value: `${num(s.soldCount)} (${pct(s.soldRatio)})`,
          source: 'vendus de ce type ÷ dépôt de ce type',
          formula: `${num(s.soldCount)} ÷ ${num(s.depositCount)}`,
        },
      ]),
    },
  ]

  return { data, audit }
}
