#!/usr/bin/env tsx
// Liste les vendeurs dont au moins un article pré-déposé est refusé : ceux dont
// le descriptif proposé, dans le doc « Descriptifs des pré-dépôts » exporté en
// Markdown, est « A supprimer ». Sortie : un tableau Markdown (vendeur, email,
// téléphone, articles refusés) à coller dans le doc, pour les prévenir.
//
//   pnpm --filter backend script:list-refused-predeposits <export.csv> --corrections=<doc.md>
//
// Les chemins sont relatifs au dossier depuis lequel on lance pnpm. Les
// réponses ignorées dans predeposit-decisions.ts sont écartées ; une ligne du
// doc dont le vendeur ou le descriptif saisi ne correspond plus à l'export est
// signalée et laissée de côté, comme à l'import.
import fs from 'fs'
import path from 'path'
import { parseCsv } from './csv'
import { correctionKey, readCorrections, REFUSED_MODEL } from './predeposit-corrections'
import { DECISIONS } from './predeposit-decisions'

const SELLER_COLUMNS = 6
const ARTICLE_COLUMNS = 8

const args = process.argv.slice(2)
const csvArg = args.find((value) => !value.startsWith('--'))
const correctionsArg = args.find((value) => value.startsWith('--corrections='))?.slice('--corrections='.length)

function clean(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function key(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// « EMILIE » → « Emilie » ; une saisie qui mélange les casses est gardée.
function titleCase(value: string): string {
  if (value !== value.toLocaleUpperCase('fr') && value !== value.toLocaleLowerCase('fr')) return value
  return value
    .toLocaleLowerCase('fr')
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toLocaleUpperCase('fr'))
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|')
}

interface Seller {
  name: string
  email: string
  phone: string
  refused: string[]
}

function main() {
  if (!csvArg || !correctionsArg) {
    console.error('Usage : script:list-refused-predeposits <export.csv> --corrections=<doc.md>')
    process.exit(1)
  }
  const cwd = process.env.INIT_CWD ?? process.cwd()
  const csvPath = path.resolve(cwd, csvArg)
  const correctionsPath = path.resolve(cwd, correctionsArg)
  for (const file of [csvPath, correctionsPath]) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Fichier introuvable : ${file}`)
      process.exit(1)
    }
  }

  const corrections = readCorrections(correctionsPath)
  const [, ...rows] = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  const skipped = new Set(DECISIONS.skip)
  const sellers = new Map<string, Seller>()
  const mismatches: string[] = []

  rows.forEach((row, index) => {
    const response = index + 1
    if (skipped.has(clean(row[0]))) return
    const name = `${titleCase(clean(row[1]))} ${titleCase(clean(row[2]))}`
    let article = 0
    for (let start = SELLER_COLUMNS; start < row.length; start += ARTICLE_COLUMNS) {
      const fields = row.slice(start, start + 7).map(clean)
      if (!fields.some(Boolean)) continue
      article++
      const correction = corrections.get(correctionKey(response, article))
      if (correction?.model !== REFUSED_MODEL) continue
      const [category, brand, , model] = fields
      if (key(correction.seller) !== key(`${row[1]}${row[2]}`) || key(correction.originalModel) !== key(model)) {
        mismatches.push(`${correction.label} : le doc dit ${correction.seller}, « ${correction.originalModel} », l'export ${name}, « ${model} »`)
        continue
      }
      const sellerKey = key(name)
      const seller = sellers.get(sellerKey) ?? { name, email: clean(row[4]).toLowerCase(), phone: clean(row[3]), refused: [] }
      seller.refused.push(`${correction.label} ${model || category} (${brand || '?'})`)
      sellers.set(sellerKey, seller)
    }
  })

  const list = [...sellers.values()].sort((a, b) => b.refused.length - a.refused.length || a.name.localeCompare(b.name, 'fr'))
  console.log(`${list.length} vendeur(s), ${list.reduce((sum, s) => sum + s.refused.length, 0)} article(s) refusé(s)\n`)
  console.log('| Vendeur | Email | Téléphone | Articles refusés |')
  console.log('| --- | --- | --- | --- |')
  for (const seller of list) {
    console.log(`| ${cell(seller.name)} | ${cell(seller.email)} | ${cell(seller.phone)} | ${cell(seller.refused.join(', '))} |`)
  }
  if (mismatches.length > 0) {
    console.error(`\n⚠️  ${mismatches.length} ligne(s) du doc ne correspondent plus à l'export, laissées de côté :`)
    for (const line of mismatches) console.error(`   ${line}`)
  }
}

main()
