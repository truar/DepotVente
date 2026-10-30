#!/usr/bin/env tsx
// Importe les pré-dépôts depuis les deux CSV au propre (predeposit-csv.ts) :
// predeposants.csv et articles.csv, dans le dossier passé en argument, tels
// qu'écrits par script:import-predeposits --export puis relus et corrigés à
// la main.
//
//   pnpm --filter backend script:import-predeposits-csv <dossier>            # simulation
//   pnpm --filter backend script:import-predeposits-csv <dossier> --apply    # écriture
//
// Le chemin est relatif au dossier depuis lequel on lance pnpm.
//
// Les valeurs sont importées telles quelles : ce sont les fichiers qui
// décident. Une catégorie, une discipline ou une marque hors des listes de
// l'app est seulement signalée ; la couleur ne l'est pas, les mélanges
// (« Blanc mauve ») feraient du bruit pour rien. Ce qui rend une fiche inutilisable
// arrête tout, sans rien écrire : numéro de fiche manquant ou en double, nom
// vide, article d'une fiche absente, lettre en double dans une fiche, prix
// illisible.
//
// Import itératif : une fiche dont le numéro est déjà en base (même
// supprimée) a été importée à un passage précédent, elle est sautée ; seules
// les nouvelles sont écrites, dans une seule transaction. Une fiche sautée dont
// le nombre d'articles a changé est signalée, à reporter à la main : elle a pu
// être reprise au comptoir.
import path from 'path'
import { prisma } from 'database'
import { brands } from '../../../../frontend/src/types/brands'
import { categories } from '../../../../frontend/src/types/categories'
import { disciplines } from '../../../../frontend/src/types/disciplines'
import {
  ARTICLE_COLUMNS,
  ARTICLES_FILE,
  SELLER_COLUMNS,
  SELLERS_FILE,
  readCsvFile,
} from './predeposit-csv'

interface Fiche {
  number: number
  lastName: string
  firstName: string
  phoneNumber: string
  city: string
  createdAt: Date
  articles: {
    letter: string
    category: string
    discipline: string
    brand: string
    model: string
    size: string
    color: string
    price: number
  }[]
}

// « 2026-10-25 16:37:29 », l'heure locale qu'écrit l'export.
function parseDate(value: string): Date | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return undefined
  const [, y, mo, d, h, mi, s = '0'] = match
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s))
}

// « 15 », « 15,50 », « 15.5 », « 15 € ».
function parsePrice(value: string): number | undefined {
  const text = value.replace(/€/g, '').replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return undefined
  return Number(text)
}

async function main() {
  const dirArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  const apply = process.argv.includes('--apply')
  if (!dirArg) {
    console.error('Usage : script:import-predeposits-csv <dossier> [--apply]')
    process.exit(1)
  }
  const dir = path.resolve(process.env.INIT_CWD ?? process.cwd(), dirArg)
  const sellers = readCsvFile(path.join(dir, SELLERS_FILE), SELLER_COLUMNS)
  const articles = readCsvFile(path.join(dir, ARTICLES_FILE), ARTICLE_COLUMNS)
  const errors = [...sellers.errors, ...articles.errors]
  if (errors.length > 0) {
    for (const error of errors) console.error(`❌ ${error}`)
    process.exit(1)
  }
  const warnings: string[] = []

  // Fiches
  const fiches = new Map<number, Fiche>()
  for (const { line, values } of sellers.rows) {
    const where = `${SELLERS_FILE} ligne ${line}`
    const number = Number(values.Fiche)
    if (!Number.isInteger(number) || number < 1) {
      errors.push(`${where} : numéro de fiche « ${values.Fiche} » illisible`)
      continue
    }
    if (fiches.has(number)) {
      errors.push(`${where} : fiche ${number} en double`)
      continue
    }
    if (values.Nom === '') errors.push(`${where} : fiche ${number} sans nom`)
    if (!/^0\d{9}$/.test(values.Téléphone)) {
      warnings.push(`${where} : fiche ${number}, téléphone « ${values.Téléphone} » pas sur 10 chiffres`)
    }
    let createdAt = parseDate(values.Date)
    if (!createdAt) {
      warnings.push(`${where} : fiche ${number}, date « ${values.Date} » illisible, remplacée par maintenant`)
      createdAt = new Date()
    }
    fiches.set(number, {
      number,
      lastName: values.Nom,
      firstName: values.Prénom,
      phoneNumber: values.Téléphone,
      city: values.Ville,
      createdAt,
      articles: [],
    })
  }

  // Articles
  const offList = (label: string, value: string, list: readonly string[]) =>
    value !== '' && !list.includes(value) ? `${label} « ${value} » hors liste` : undefined
  for (const { line, values } of articles.rows) {
    const where = `${ARTICLES_FILE} ligne ${line}`
    const fiche = fiches.get(Number(values.Fiche))
    if (!fiche) {
      errors.push(`${where} : fiche « ${values.Fiche} » absente de ${SELLERS_FILE}`)
      continue
    }
    const letter = values.Lettre.toUpperCase()
    if (!/^[A-Z]{1,2}$/.test(letter)) errors.push(`${where} : lettre « ${values.Lettre} » illisible`)
    if (fiche.articles.some((article) => article.letter === letter)) {
      errors.push(`${where} : lettre ${letter} en double dans la fiche ${fiche.number}`)
    }
    const price = parsePrice(values.Prix)
    if (price === undefined) errors.push(`${where} : prix « ${values.Prix} » illisible`)
    const notes = [
      offList('catégorie', values.Catégorie, categories),
      offList('discipline', values.Discipline, disciplines),
      offList('marque', values.Marque, brands),
    ].filter(Boolean)
    if (notes.length > 0) warnings.push(`${where} : fiche ${fiche.number}${letter}, ${notes.join(', ')}`)
    fiche.articles.push({
      letter,
      category: values.Catégorie,
      discipline: values.Discipline,
      brand: values.Marque,
      model: values.Descriptif,
      size: values.Taille,
      color: values.Couleur,
      price: price ?? 0,
    })
  }
  for (const fiche of fiches.values()) {
    if (fiche.articles.length === 0) warnings.push(`fiche ${fiche.number} ${fiche.lastName} : aucun article`)
  }

  // État de la base. deletedAt: {} lève le filtre de l'extension soft-delete :
  // une fiche supprimée au comptoir compte aussi.
  const existing = await prisma.predeposit.findMany({
    where: { deletedAt: {} },
    select: {
      predepositIndex: true,
      sellerLastName: true,
      sellerPhoneNumber: true,
      deletedAt: true,
      _count: { select: { articles: { where: { deletedAt: null } } } },
    },
  })
  const byNumber = new Map(existing.map((p) => [p.predepositIndex, p]))
  const skipped: string[] = []
  for (const fiche of fiches.values()) {
    const there = byNumber.get(fiche.number)
    if (!there) continue
    const state = there.deletedAt ? ', supprimée' : ''
    const label = `fiche ${fiche.number} (${there.sellerLastName} en base${state})`
    skipped.push(
      there._count.articles === fiche.articles.length
        ? label
        : `${label} ⚠️  ${fiche.articles.length} article(s) dans le fichier, ${there._count.articles} en base — à reporter à la main`,
    )
    if (there.sellerLastName.toLowerCase() !== fiche.lastName.toLowerCase()) {
      warnings.push(`fiche ${fiche.number} : ${fiche.lastName} dans le fichier, ${there.sellerLastName} en base`)
    }
  }
  const toCreate = [...fiches.values()].filter((fiche) => !byNumber.has(fiche.number)).sort((a, b) => a.number - b.number)

  // Rapport
  const count = toCreate.reduce((sum, fiche) => sum + fiche.articles.length, 0)
  console.log(`📖 ${fiches.size} fiche(s), ${articles.rows.length} article(s) dans ${dir}\n`)
  console.log(`📋 ${toCreate.length} fiche(s) à créer, ${count} article(s) :`)
  for (const fiche of toCreate) {
    console.log(
      `   ${String(fiche.number).padStart(3)}  ${fiche.lastName} ${fiche.firstName} — ${fiche.phoneNumber} — ` +
        `${fiche.city} — ${fiche.articles.length} article(s)`,
    )
  }
  console.log()
  if (skipped.length > 0) {
    console.log(`⏭️  ${skipped.length} fiche(s) déjà en base, sautée(s) :`)
    for (const line of skipped) console.log(`   ${line}`)
    console.log()
  }
  if (warnings.length > 0) {
    console.log(`🔎 ${warnings.length} remarque(s), importé tel quel :`)
    for (const warning of warnings) console.log(`   ${warning}`)
    console.log()
  }
  if (errors.length > 0) {
    console.error(`❌ ${errors.length} erreur(s) à corriger dans les fichiers, rien n'est écrit :`)
    for (const error of errors) console.error(`   ${error}`)
    process.exitCode = 1
    return
  }
  if (!apply) {
    console.log('Simulation : rien n’a été écrit. Relancer avec --apply pour importer.')
    return
  }
  if (toCreate.length === 0) {
    console.log('✅ Rien de nouveau à importer.')
    return
  }

  // articleIndex : compteur global, à la suite des articles déjà en base.
  const last = (await prisma.predepositArticle.aggregate({ _max: { articleIndex: true } }))._max.articleIndex ?? 0
  const year = new Date().getFullYear()
  let articleIndex = last
  await prisma.$transaction(
    async (tx) => {
      for (const fiche of toCreate) {
        await tx.predeposit.create({
          data: {
            predepositIndex: fiche.number,
            sellerLastName: fiche.lastName,
            sellerFirstName: fiche.firstName,
            sellerPhoneNumber: fiche.phoneNumber,
            sellerCity: fiche.city,
            depositId: null,
            createdAt: fiche.createdAt,
            articles: {
              create: fiche.articles.map((article) => ({
                price: article.price,
                category: article.category,
                discipline: article.discipline,
                brand: article.brand,
                model: article.model,
                size: article.size,
                color: article.color,
                year,
                identificationLetter: article.letter,
                articleIndex: ++articleIndex,
                createdAt: fiche.createdAt,
              })),
            },
          },
        })
      }
    },
    { timeout: 60_000 },
  )

  // Relecture : la base redonne chaque fiche avec son nombre d'articles.
  const stored = await prisma.predeposit.findMany({
    where: { predepositIndex: { in: toCreate.map((fiche) => fiche.number) } },
    select: { predepositIndex: true, _count: { select: { articles: true } } },
  })
  const storedCount = new Map(stored.map((p) => [p.predepositIndex, p._count.articles]))
  const bad = toCreate.filter((fiche) => storedCount.get(fiche.number) !== fiche.articles.length)
  if (bad.length > 0) {
    console.error(`❌ Relecture : ${bad.map((fiche) => fiche.number).join(', ')} ne correspondent pas`)
    process.exitCode = 1
    return
  }
  console.log(`✅ ${toCreate.length} pré-dépôt(s), ${count} article(s) importés. Les postes les reçoivent à leur prochain poll.`)
}

main()
  .catch((error) => {
    console.error('❌ Erreur :', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
