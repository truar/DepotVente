#!/usr/bin/env tsx
// Importe les fiches des pros à partir d'articles-pro.csv, le fichier que
// pros/decode_pro.py écrit après avoir décodé et vérifié l'export des pros.
//
// Une fiche par pro : un contact (le nom du magasin, sa ville), un dépôt PRO
// (cotisation PRO, 0 €) et ses articles en RECEPTION_PENDING, à réceptionner
// au scan. Les postes les récupèrent au prochain poll delta (updatedAt =
// now()).
//
//   pnpm --filter backend script:import-pros <articles-pro.csv>            # simulation
//   pnpm --filter backend script:import-pros <articles-pro.csv> --apply    # écriture
//
// Le chemin du CSV est relatif au dossier depuis lequel on lance pnpm.
//
// Garde-fous : --apply refuse d'écrire si un numéro de fiche ou un code
// d'article existe déjà en base, ce qui empêche aussi un second passage du
// script. Tout est écrit dans une seule transaction, tout ou rien, puis relu.
import fs from 'fs'
import path from 'path'
import { prisma } from 'database'
import { parseCsv } from './csv'
import { readProArticles } from './pro-articles'

// Comme dans l'ancien logiciel, les fiches des pros sont saisies au poste 1.
const PRO_WORKSTATION = 1

async function main() {
  const csvArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  if (!csvArg) {
    console.error('Usage : script:import-pros <articles-pro.csv> [--apply]')
    process.exit(1)
  }
  const csvPath = path.resolve(process.env.INIT_CWD ?? process.cwd(), csvArg)
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier introuvable : ${csvPath}`)
    process.exit(1)
  }
  let text = ''
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(csvPath))
  } catch {
    console.error('❌ Le fichier n’est pas en UTF-8 : le reprendre tel que decode_pro.py l’a écrit.')
    process.exit(1)
  }

  const { year, fiches, errors } = readProArticles(parseCsv(text))
  if (fiches.length > 0) {
    const taken = await prisma.deposit.findMany({
      where: { depositIndex: { in: fiches.map((fiche) => fiche.number) } },
      select: { depositIndex: true, deletedAt: true },
    })
    for (const deposit of taken) {
      errors.push(`fiche ${deposit.depositIndex} déjà en base${deposit.deletedAt ? ' (supprimée)' : ''}`)
    }
    const codes = fiches.flatMap((fiche) => fiche.articles.map((article) => article.code))
    const takenCodes = await prisma.article.findMany({ where: { code: { in: codes } }, select: { code: true } })
    if (takenCodes.length > 0) {
      const sample = takenCodes.slice(0, 10).map((article) => article.code)
      errors.push(`${takenCodes.length} code(s) d'article déjà en base : ${sample.join(', ')}${takenCodes.length > 10 ? '…' : ''}`)
    }
  }

  for (const fiche of fiches) {
    const total = fiche.articles.reduce((sum, article) => sum + article.price, 0)
    console.log(`fiche ${fiche.number} ${fiche.name} (${fiche.city}) : ${fiche.articles.length} articles, ${total} €`)
  }
  const count = fiches.reduce((sum, fiche) => sum + fiche.articles.length, 0)
  const total = fiches.reduce((sum, fiche) => sum + fiche.articles.reduce((s, article) => s + article.price, 0), 0)
  console.log(`total : ${fiches.length} fiches, ${count} articles, ${total} €`)
  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} erreur(s), rien n'est écrit :`)
    for (const error of errors) console.error(`   ${error}`)
    process.exit(1)
  }
  if (!process.argv.includes('--apply')) {
    console.log('\nSimulation : rien n’est écrit. Relancer avec --apply.')
    return
  }

  // articleIndex : compteur global, à la suite des articles déjà en base.
  const last = (await prisma.article.aggregate({ _max: { articleIndex: true } }))._max.articleIndex ?? 0
  await prisma.$transaction(
    async (tx) => {
      let articleIndex = last
      for (const fiche of fiches) {
        const seller = await tx.contact.create({
          data: { lastName: fiche.name, firstName: '', phoneNumber: '', city: fiche.city },
        })
        const deposit = await tx.deposit.create({
          data: {
            sellerId: seller.id,
            type: 'PRO',
            contributionStatus: 'PRO',
            contributionAmount: 0,
            depositIndex: fiche.number,
            incrementStart: PRO_WORKSTATION,
            dropWorkstationId: PRO_WORKSTATION,
          },
        })
        await tx.article.createMany({
          data: fiche.articles.map((article) => ({
            depositId: deposit.id,
            price: article.price,
            category: article.category,
            discipline: article.discipline,
            brand: article.brand,
            model: article.model,
            serialNumber: article.serialNumber,
            size: article.size,
            color: article.color,
            code: article.code,
            year: year as number,
            depositIndex: fiche.number,
            identificationLetter: article.letter,
            articleIndex: ++articleIndex,
            status: 'RECEPTION_PENDING',
          })),
        })
      }
    },
    { timeout: 60_000 },
  )

  // Relecture : la base redonne chaque fiche, ses codes et son total.
  let ok = true
  for (const fiche of fiches) {
    const stored = await prisma.article.findMany({
      where: { depositIndex: fiche.number, deletedAt: null, deposit: { type: 'PRO', deletedAt: null } },
      select: { code: true, price: true, status: true },
    })
    const storedCodes = new Set(stored.map((article) => article.code))
    const sameCodes =
      stored.length === fiche.articles.length && fiche.articles.every((article) => storedCodes.has(article.code))
    const storedTotal = stored.reduce((sum, article) => sum + Number(article.price), 0)
    const expectedTotal = fiche.articles.reduce((sum, article) => sum + article.price, 0)
    const pending = stored.every((article) => article.status === 'RECEPTION_PENDING')
    const good = sameCodes && storedTotal === expectedTotal && pending
    ok &&= good
    console.log(`${good ? '✅' : '❌'} fiche ${fiche.number} : ${stored.length} articles, ${storedTotal} € en base`)
  }
  if (!ok) process.exit(1)
  console.log(`\n✅ ${fiches.length} fiche(s) pro importée(s). Les postes les reçoivent à leur prochain poll.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
