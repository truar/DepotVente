#!/usr/bin/env tsx
// Importe les pré-dépôts saisis par les vendeurs dans le Google Form
// « Pré-enregistrement bourse au ski », à partir de l'export CSV des réponses.
//
// Prévu pour être lancé une seule fois, le matin de la bourse, sur la base du
// jour. Les pré-dépôts sont créés sans dépôt associé ; les postes les
// récupèrent au prochain poll delta (updatedAt = now()).
//
//   pnpm --filter backend script:import-predeposits <export.csv>              # simulation
//   pnpm --filter backend script:import-predeposits <export.csv> --apply      # écriture
//
// Le chemin du CSV est relatif au dossier depuis lequel on lance pnpm.
//
// Format du CSV : 6 colonnes vendeur (Timestamp, Prénom, Nom, Portable, Email
// Address, Ville), puis N blocs de 8 colonnes par article (Type de matériel,
// Marque, Discipline, Descriptif, Couleur dominante, Taille, Prix souhaité,
// Déposer un autre article). Un bloc est un article dès qu'un de ses sept
// premiers champs est rempli ; « Déposer un autre article » est ignoré.
//
// Numérotation : les fiches sont triées par nom puis prénom et numérotées à la
// suite du plus grand predepositIndex déjà en base. Les articles prennent les
// lettres A, B, C… dans l'ordre du formulaire, et un articleIndex global à la
// suite du plus grand déjà en base.
//
// Doublons : deux réponses qui partagent un téléphone, un email ou un nom +
// prénom sont signalées et ne sont jamais fusionnées d'office. Chaque réponse
// d'un groupe de doublons doit être arbitrée avant --apply :
//   --merge 37,38   fusionne ces réponses en une seule fiche (articles à la
//                   suite, dans l'ordre des réponses ; coordonnées de la plus
//                   récente)
//   --keep 12,40    garde ces réponses comme fiches distinctes
//   --skip 61       ignore ces réponses
// Les numéros sont ceux affichés par la simulation (« réponse n »), c'est-à-dire
// le rang de la réponse dans le CSV, en-tête exclu. Chaque option peut être
// répétée.
//
// Garde-fou : --apply refuse d'écrire si un pré-dépôt avec le même téléphone
// existe déjà en base, ce qui empêche un second passage du script.
import fs from 'fs'
import path from 'path'
import { prisma } from 'database'
import { brands } from '../../../../frontend/src/types/brands'
import { categories } from '../../../../frontend/src/types/categories'
import { cities } from '../../../../frontend/src/types/cities'
import { colors } from '../../../../frontend/src/types/colors'
import { disciplines } from '../../../../frontend/src/types/disciplines'
import { normalizeSize } from './predeposit-size'

const SELLER_HEADERS = ['Timestamp', 'Prénom', 'Nom', 'Portable', 'Email Address', 'Ville']
const ARTICLE_HEADERS = [
  'Type de matériel',
  'Marque',
  'Discipline',
  'Descriptif',
  'Couleur dominante',
  'Taille',
  'Prix souhaité (en €, pas de centimes)',
  'Déposer un autre article',
]

// Libellés du formulaire → valeurs de l'application (types/categories.ts et
// types/disciplines.ts), pour ceux qui diffèrent autrement que par les accents
// ou la casse : « Batons » ou « Telemark » retrouvent « Bâtons » et
// « Télémark » tout seuls. Une valeur introuvable est une erreur : le
// formulaire ou les listes ont changé et le mapping doit être revu.
const CATEGORY_MAP: Record<string, string> = {
  'Vêtements de ski': 'Vêtement',
}
const DISCIPLINE_MAP: Record<string, string> = {
  'Randonnée Pédestre': 'Rando Pédestre',
  'Randonnée Alpine': 'Rando Alpine',
}

// Fautes de frappe courantes que la comparaison sans casse ni accent ne
// rattrape pas. Clé : forme normalisée par key().
const BRAND_ALIASES: Record<string, string> = {
  quechua: 'Quechua',
  queshua: 'Quechua',
  queschua: 'Quechua',
  volki: 'Volkl',
  fisher: 'Fischer',
  technica: 'Tecnica',
  dare2be: 'Dare2b',
}

// Couleurs écrites au féminin ou au pluriel, ramenées à types/colors.ts.
const COLOR_ALIASES: Record<string, string> = {
  bleue: 'Bleu',
  bleus: 'Bleu',
  bleues: 'Bleu',
  noire: 'Noir',
  noirs: 'Noir',
  noires: 'Noir',
  grise: 'Gris',
  grises: 'Gris',
  blanche: 'Blanc',
  blancs: 'Blanc',
  blanches: 'Blanc',
  verte: 'Vert',
  verts: 'Vert',
  vertes: 'Vert',
  violette: 'Violet',
  oorange: 'Orange',
}

// Communes écrites autrement que dans types/cities.ts. Clé : forme normalisée
// par cityKey().
const CITY_ALIASES: Record<string, string> = {
  VALLIERESSFIER: 'VALLIERES',
  MARCELLAZALBANAIS: 'MARCELLAZ',
  ENTRELACSSTGERMAINLACHAMBOTTE: 'ENTRELACS',
  MENTHONNEXSOUSCLERMONT: 'MENTHONNEX',
  MENTHONNEXSOUSCLERMOND: 'MENTHONNEX',
}

// ── Arguments ───────────────────────────────────────────────────────────────

function listArg(name: string): number[] {
  const values: number[] = []
  process.argv.forEach((value, index) => {
    if (value !== `--${name}`) return
    for (const part of (process.argv[index + 1] ?? '').split(',')) {
      const n = Number(part.trim())
      if (!Number.isInteger(n) || n < 1) {
        console.error(`❌ --${name} attend des numéros de réponse : « ${process.argv[index + 1]} »`)
        process.exit(1)
      }
      values.push(n)
    }
  })
  return values
}

function mergeGroups(): number[][] {
  const groups: number[][] = []
  process.argv.forEach((value, index) => {
    if (value === '--merge') groups.push((process.argv[index + 1] ?? '').split(',').map((n) => Number(n.trim())))
  })
  return groups
}

const apply = process.argv.includes('--apply')
const csvArg = process.argv.slice(2).find((value, index, args) => {
  if (value.startsWith('--')) return false
  const previous = args[index - 1]
  return !['--merge', '--keep', '--skip'].includes(previous)
})

// ── Normalisation ───────────────────────────────────────────────────────────

function clean(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Forme de comparaison : minuscules, sans accent, sans rien d'autre que
// lettres et chiffres (« Wed'ze », « WEDZE » et « wedze » donnent « wedze »).
function key(value: string): string {
  return stripAccents(value).toLowerCase().replace(/[^a-z0-9]/g, '')
}

// « EMILIE » → « Emilie », « jean-charles » → « Jean-Charles ». Une saisie qui
// mélange déjà majuscules et minuscules est gardée telle quelle.
function titleCase(value: string): string {
  if (value !== value.toLocaleUpperCase('fr') && value !== value.toLocaleLowerCase('fr')) return value
  return value
    .toLocaleLowerCase('fr')
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toLocaleUpperCase('fr'))
}

// « BLEU FONCE » → « Bleu fonce », « bleu marine » → « Bleu marine ».
function sentenceCase(value: string): string {
  const base =
    value === value.toLocaleUpperCase('fr') ? value.toLocaleLowerCase('fr') : value
  return base.charAt(0).toLocaleUpperCase('fr') + base.slice(1)
}

// « +33 6 31… », « 0033 6 31… » et « +33 (0)6 31… » → « 0631… » ; un numéro
// de 9 chiffres a perdu son 0 initial (Google Sheets le lit comme un nombre).
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const national = digits.replace(/^(00)?33(0)?(?=\d{9}$)/, '')
  return national.length === 9 ? `0${national}` : national
}

function cityKey(value: string): string {
  return stripAccents(value)
    .toUpperCase()
    .replace(/\bSAINTE?\b/g, 'ST')
    .replace(/\bSUR\b/g, 'S')
    .replace(/[^A-Z0-9]/g, '')
}

const citiesByKey = new Map(cities.map((city) => [cityKey(city), city]))
const brandsByKey = new Map(brands.map((brand) => [key(brand), brand]))
const categoriesByKey = new Map(categories.map((category) => [key(category), category]))
const disciplinesByKey = new Map(disciplines.map((discipline) => [key(discipline), discipline]))
const colorsByKey = new Map(colors.map((color) => [key(color), color]))

function normalizeCity(value: string): string {
  const k = cityKey(value)
  const known = citiesByKey.get(k) ?? CITY_ALIASES[k]
  return known ?? value.toLocaleUpperCase('fr')
}

function normalizeBrand(value: string): string {
  if (value === '') return '?'
  const k = key(value)
  const known = brandsByKey.get(k) ?? BRAND_ALIASES[k]
  return known ?? titleCase(value)
}

// Distance de Damerau-Levenshtein (variante « optimal string alignment ») :
// lettres ajoutées, supprimées, remplacées, ou deux voisines inversées, chacune
// pour 1. « rossigonl » est à 1 de « rossignol ».
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

// Valeurs de la liste les plus proches d'une saisie hors liste, comparées sous
// leur forme normalisée (sans casse ni accent) : au plus 3, à égalité de
// distance, et seulement jusqu'au seuil — 1 faute jusqu'à 4 lettres, une de
// plus par tranche de 4 lettres, 3 au plus. Le script propose, ne corrige pas.
function suggest(value: string, byKey: Map<string, string>, toKey: (v: string) => string = key): string {
  const k = toKey(value)
  if (k === '') return ''
  const threshold = Math.min(3, Math.ceil(k.length / 4))
  let best = threshold
  let matches: string[] = []
  for (const [candidateKey, candidate] of byKey) {
    if (candidateKey === '') continue
    const dist = distance(k, candidateKey)
    if (dist > best) continue
    if (dist < best || matches.length === 0) [best, matches] = [dist, [candidate]]
    else matches.push(candidate)
  }
  return matches.length > 0 && matches.length <= 3 ? ` → ${matches.join(' / ')} ?` : ''
}

function normalizeColor(value: string): string {
  const k = key(value)
  return colorsByKey.get(k) ?? COLOR_ALIASES[k] ?? sentenceCase(value)
}

// « 10/15/2025 17:49:47 » : format américain M/D/YYYY de Google Sheets.
function parseTimestamp(value: string): Date | undefined {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match) return undefined
  const [, month, day, year, hours, minutes, seconds] = match.map(Number)
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

function identificationLetter(index: number): string {
  let letter = ''
  let n = index
  do {
    letter = String.fromCharCode(65 + (n % 26)) + letter
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return letter
}

// ── Lecture du CSV ──────────────────────────────────────────────────────────

// Google exporte en UTF-8. Un CSV ouvert puis réenregistré dans Excel arrive
// souvent dans un autre encodage (« Val\xe9rie », illisible en UTF-8), ou
// décodé puis réencodé une fois de trop (« ValÃ©rie »). Dans les deux cas
// les accents seraient importés abîmés : on s'arrête avant.
function readUtf8(csvPath: string): string {
  const fail = (detail: string) => {
    console.error(`❌ Accents abîmés dans le CSV : ${detail}`)
    console.error('   Le fichier a sans doute été réenregistré hors de Google (Excel…).')
    console.error('   Retélécharger l’export depuis Google Sheets : Fichier → Télécharger → CSV.')
    process.exit(1)
  }
  let text = ''
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(csvPath))
  } catch {
    fail('le fichier n’est pas en UTF-8')
  }
  const lines = text.split(/\r?\n/)
  const broken = lines.findIndex((line) => /\uFFFD|[ÃÂ][\u0080-\u00BF]/.test(line))
  if (broken !== -1) {
    const sample = lines[broken].match(/.{0,20}(?:\uFFFD|[ÃÂ][\u0080-\u00BF]).{0,20}/)?.[0]
    fail(`ligne ${broken + 1}, « ${sample} »`)
  }
  return text
}

// CSV RFC 4180 : virgules, guillemets doublés, retours à la ligne entre
// guillemets.
function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const text = content.replace(/^﻿/, '')
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''))
}

function checkHeaders(header: string[]) {
  const problems: string[] = []
  SELLER_HEADERS.forEach((expected, index) => {
    if (clean(header[index]) !== expected) problems.push(`colonne ${index + 1} : « ${header[index]} » au lieu de « ${expected} »`)
  })
  if ((header.length - SELLER_HEADERS.length) % ARTICLE_HEADERS.length !== 0) {
    problems.push(`${header.length} colonnes : pas un nombre entier de blocs article de ${ARTICLE_HEADERS.length} colonnes`)
  }
  for (let start = SELLER_HEADERS.length; start < header.length; start += ARTICLE_HEADERS.length) {
    ARTICLE_HEADERS.forEach((expected, offset) => {
      const actual = clean(header[start + offset])
      if (actual !== undefined && actual !== '' && actual !== expected) {
        problems.push(`colonne ${start + offset + 1} : « ${actual} » au lieu de « ${expected} »`)
      }
    })
  }
  if (problems.length > 0) {
    console.error('❌ Le CSV n’a pas le format attendu du formulaire :')
    for (const problem of problems) console.error(`   ${problem}`)
    process.exit(1)
  }
}

// ── Modèle ──────────────────────────────────────────────────────────────────

interface ArticleInput {
  category: string
  discipline: string
  brand: string
  model: string
  size: string
  color: string
  price: number
}

interface Response {
  number: number
  createdAt: Date
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  city: string
  articles: ArticleInput[]
}

interface Report {
  errors: string[]
  warnings: string[]
  // Valeurs absentes d'une liste à suggestions (ville, couleur) : le poste les
  // affiche telles quelles, mais il faut les relire.
  offList: string[]
  // Tailles dont normalizeSize a retiré des mots (« Pointure », un nom de
  // modèle…) : à relire, le mot retiré peut avoir sa place dans le descriptif.
  sizes: string[]
}

function readResponse(row: string[], number: number, report: Report): Response {
  // Ligne de la Google Sheet des réponses : l'en-tête est la ligne 1.
  const who = `ligne ${number + 1}, réponse ${number} (${clean(row[2])} ${clean(row[1])})`
  const createdAt = parseTimestamp(clean(row[0]))
  if (!createdAt) report.errors.push(`${who} : horodatage illisible « ${row[0]} »`)

  const phoneNumber = normalizePhone(row[3] ?? '')
  if (!/^0\d{9}$/.test(phoneNumber)) report.warnings.push(`${who} : téléphone « ${clean(row[3])} » → « ${phoneNumber} », pas 10 chiffres`)

  const city = normalizeCity(clean(row[5]))
  if (city !== '' && !cities.includes(city)) report.offList.push(`${who} : ville « ${clean(row[5])} »${suggest(clean(row[5]), citiesByKey, cityKey)}`)

  const articles: ArticleInput[] = []
  for (let start = SELLER_HEADERS.length; start < row.length; start += ARTICLE_HEADERS.length) {
    const [rawCategory, rawBrand, rawDiscipline, rawModel, rawColor, rawSize, rawPrice] = row
      .slice(start, start + 7)
      .map(clean)
    if (![rawCategory, rawBrand, rawDiscipline, rawModel, rawColor, rawSize, rawPrice].some(Boolean)) continue
    const where = `${who}, article ${identificationLetter(articles.length)}`

    const category = categoriesByKey.get(key(CATEGORY_MAP[rawCategory] ?? rawCategory)) ?? rawCategory
    if (!categories.includes(category)) report.errors.push(`${where} : type de matériel inconnu « ${rawCategory} »${suggest(rawCategory, categoriesByKey)}`)

    const discipline = disciplinesByKey.get(key(DISCIPLINE_MAP[rawDiscipline] ?? rawDiscipline)) ?? rawDiscipline
    if (!disciplines.includes(discipline)) report.errors.push(`${where} : discipline inconnue « ${rawDiscipline} »${suggest(rawDiscipline, disciplinesByKey)}`)

    // La marque est une liste fermée au poste, comme la catégorie et la
    // discipline : une valeur hors liste s'y affiche vide et l'info est perdue.
    // On vérifie la valeur finale, alias compris.
    const brand = normalizeBrand(rawBrand)
    if (!brands.includes(brand)) report.errors.push(`${where} : marque « ${rawBrand} » absente de la liste${suggest(rawBrand, brandsByKey)}`)

    const price = Number(rawPrice.replace(/[^\d,.]/g, '').replace(',', '.'))
    if (!(price > 0)) report.errors.push(`${where} : prix « ${rawPrice} » illisible`)

    const color = rawColor === '' ? '' : normalizeColor(rawColor)
    if (color === '') report.warnings.push(`${where} : couleur vide, à compléter au dépôt`)
    else if (!colors.includes(color)) report.offList.push(`${where} : couleur « ${rawColor} »${suggest(rawColor, colorsByKey)}`)

    const { size, removed } = normalizeSize(rawSize)
    if (removed.length > 0) report.sizes.push(`${where} : taille « ${rawSize} » → « ${size} », retiré : ${removed.join(', ')}`)

    articles.push({ category, discipline, brand, model: rawModel, size, color, price })
  }
  if (articles.length === 0) report.warnings.push(`${who} : aucun article`)

  return {
    number,
    createdAt: createdAt ?? new Date(),
    firstName: titleCase(clean(row[1])),
    lastName: clean(row[2]).toLocaleUpperCase('fr'),
    phoneNumber,
    email: clean(row[4]).toLowerCase(),
    city,
    articles,
  }
}

// Regroupe les réponses qui partagent un téléphone, un email ou un nom +
// prénom (union-find). Ne renvoie que les groupes d'au moins deux réponses.
function findDuplicates(responses: Response[]): Response[][] {
  const parent = responses.map((_, index) => index)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const seen = new Map<string, number>()
  responses.forEach((response, index) => {
    const keys = [
      response.phoneNumber && `tel:${response.phoneNumber}`,
      response.email && `mail:${response.email}`,
      `nom:${key(response.lastName)}|${key(response.firstName)}`,
    ].filter(Boolean) as string[]
    for (const k of keys) {
      const other = seen.get(k)
      if (other === undefined) seen.set(k, index)
      else parent[find(index)] = find(other)
    }
  })
  const groups = new Map<number, Response[]>()
  responses.forEach((response, index) => {
    const root = find(index)
    groups.set(root, [...(groups.get(root) ?? []), response])
  })
  return [...groups.values()].filter((group) => group.length > 1)
}

function describe(response: Response): string {
  const date = response.createdAt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  const articles = response.articles.map((a) => `${a.category} ${a.brand} ${a.price}€`).join(', ')
  return (
    `réponse ${response.number} — ${date} — ${response.lastName} ${response.firstName}, ` +
    `${response.phoneNumber}, ${response.email}, ${response.city}\n` +
    `        ${response.articles.length} article(s) : ${articles}`
  )
}

// ── Programme ───────────────────────────────────────────────────────────────

async function main() {
  if (!csvArg) {
    console.error(
      'Usage : script:import-predeposits <export.csv> [--merge 37,38] [--keep 12,40] [--skip 61] [--apply]',
    )
    process.exit(1)
  }
  const csvPath = path.resolve(process.env.INIT_CWD ?? process.cwd(), csvArg)
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier introuvable : ${csvPath}`)
    process.exit(1)
  }

  const [header, ...rows] = parseCsv(readUtf8(csvPath))
  checkHeaders(header)

  const report: Report = { errors: [], warnings: [], offList: [], sizes: [] }
  const allResponses = rows.map((row, index) => readResponse(row, index + 1, report))
  const byNumber = new Map(allResponses.map((response) => [response.number, response]))

  // Arbitrages
  const merges = mergeGroups()
  const keeps = new Set(listArg('keep'))
  const skips = new Set(listArg('skip'))
  const decided = new Set<number>([...keeps, ...skips])
  for (const group of merges) {
    if (group.length < 2 || group.some((n) => !Number.isInteger(n))) {
      console.error(`❌ --merge attend au moins deux numéros de réponse séparés par des virgules`)
      process.exit(1)
    }
    for (const n of group) decided.add(n)
  }
  const mentioned = [...merges.flat(), ...keeps, ...skips]
  for (const n of mentioned) {
    if (!byNumber.has(n)) {
      console.error(`❌ Réponse ${n} inexistante (le CSV en compte ${allResponses.length})`)
      process.exit(1)
    }
  }
  if (new Set(mentioned).size !== mentioned.length) {
    console.error('❌ Une même réponse est citée dans plusieurs arbitrages')
    process.exit(1)
  }

  const duplicates = findDuplicates(allResponses)
  const unresolved = duplicates.filter((group) => group.some((response) => !decided.has(response.number)))

  // Fiches à créer : réponses fusionnées, gardées, ou sans doublon ; les
  // réponses ignorées disparaissent.
  const merged = new Set(merges.flat())
  const fiches: Response[] = []
  for (const group of merges) {
    const responses = group.map((n) => byNumber.get(n)!).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const latest = responses[responses.length - 1]
    fiches.push({
      ...latest,
      createdAt: responses[0].createdAt,
      articles: responses.flatMap((response) => response.articles),
    })
  }
  for (const response of allResponses) {
    if (merged.has(response.number) || skips.has(response.number)) continue
    if (response.articles.length === 0) continue
    fiches.push(response)
  }
  fiches.sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) ||
      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' }),
  )

  // État de la base
  let lastPredepositIndex = 0
  let lastArticleIndex = 0
  let existingPhones = new Map<string, string>()
  try {
    const [predepositMax, articleMax, existing] = await Promise.all([
      prisma.predeposit.aggregate({ _max: { predepositIndex: true } }),
      prisma.predepositArticle.aggregate({ _max: { articleIndex: true } }),
      prisma.predeposit.findMany({
        where: { deletedAt: null },
        select: { predepositIndex: true, sellerLastName: true, sellerPhoneNumber: true },
      }),
    ])
    lastPredepositIndex = predepositMax._max.predepositIndex ?? 0
    lastArticleIndex = articleMax._max.articleIndex ?? 0
    existingPhones = new Map(
      existing.map((p) => [normalizePhone(p.sellerPhoneNumber), `fiche ${p.predepositIndex} ${p.sellerLastName}`]),
    )
  } catch (error) {
    if (apply) throw error
    console.warn(`⚠️  Base injoignable, simulation sur une base vide : ${(error as Error).message.split('\n')[0]}\n`)
  }
  const alreadyThere = fiches.filter((fiche) => existingPhones.has(fiche.phoneNumber))

  const year = new Date().getFullYear()
  let articleIndex = lastArticleIndex
  const plan = fiches.map((fiche, offset) => ({
    fiche,
    predepositIndex: lastPredepositIndex + 1 + offset,
    articles: fiche.articles.map((article, index) => ({
      ...article,
      identificationLetter: identificationLetter(index),
      articleIndex: ++articleIndex,
    })),
  }))

  // Rapport
  console.log(`📖 ${path.basename(csvPath)} : ${allResponses.length} réponse(s)\n`)
  console.log(`📋 ${plan.length} fiche(s) à créer, numérotées à partir de ${lastPredepositIndex + 1} :`)
  for (const { fiche, predepositIndex, articles } of plan) {
    const origin = merged.has(fiche.number)
      ? `réponses ${merges.find((g) => g.includes(fiche.number))!.join('+')}`
      : `réponse ${fiche.number}`
    console.log(
      `   ${String(predepositIndex).padStart(3)}  ${fiche.lastName} ${fiche.firstName} — ${fiche.phoneNumber} — ` +
        `${fiche.city} — ${articles.length} article(s) (${origin})`,
    )
  }
  console.log(`   Total : ${plan.reduce((sum, p) => sum + p.articles.length, 0)} article(s)\n`)

  if (duplicates.length > 0) {
    console.log(`👥 ${duplicates.length} groupe(s) de doublons (même téléphone, email ou nom) :`)
    for (const group of duplicates) {
      const pending = group.some((response) => !decided.has(response.number))
      console.log(`   ${pending ? '❓ à arbitrer' : '✅ arbitré'} :`)
      for (const response of group) console.log(`      ${describe(response)}`)
    }
    console.log()
  }
  if (report.offList.length > 0) {
    console.log('🔎 Hors liste, gardé tel quel (à relire, corriger dans le CSV si besoin) :')
    for (const line of report.offList) console.log(`   ${line}`)
    console.log()
  }
  if (report.sizes.length > 0) {
    console.log('✂️  Tailles raccourcies, mots retirés (à relire, le descriptif peut les reprendre) :')
    for (const line of report.sizes) console.log(`   ${line}`)
    console.log()
  }
  if (report.warnings.length > 0) {
    console.log('⚠️  Avertissements :')
    for (const warning of report.warnings) console.log(`   ${warning}`)
    console.log()
  }

  const blockers = [...report.errors]
  for (const group of unresolved) {
    blockers.push(
      `doublon non arbitré : réponses ${group.map((r) => r.number).join(', ')} ` +
        `(--merge ${group.map((r) => r.number).join(',')}, --keep … ou --skip …)`,
    )
  }
  for (const fiche of alreadyThere) {
    blockers.push(`${fiche.lastName} ${fiche.firstName} (${fiche.phoneNumber}) existe déjà en base : ${existingPhones.get(fiche.phoneNumber)}`)
  }
  if (blockers.length > 0) {
    console.log('❌ À régler avant --apply :')
    for (const blocker of blockers) console.log(`   ${blocker}`)
    console.log()
  }

  if (!apply) {
    console.log('Simulation : rien n’a été écrit. Relancer avec --apply pour importer.')
    return
  }
  if (blockers.length > 0) {
    console.error('❌ Import annulé, rien n’a été écrit.')
    process.exitCode = 1
    return
  }

  // Tout ou rien : une transaction pour l'ensemble des fiches.
  await prisma.$transaction(
    async (tx) => {
      for (const { fiche, predepositIndex, articles } of plan) {
        await tx.predeposit.create({
          data: {
            predepositIndex,
            sellerLastName: fiche.lastName,
            sellerFirstName: fiche.firstName,
            sellerPhoneNumber: fiche.phoneNumber,
            sellerCity: fiche.city,
            depositId: null,
            createdAt: fiche.createdAt,
            articles: {
              create: articles.map((article) => ({
                price: article.price,
                category: article.category,
                discipline: article.discipline,
                brand: article.brand,
                model: article.model,
                size: article.size,
                color: article.color,
                year,
                identificationLetter: article.identificationLetter,
                articleIndex: article.articleIndex,
                createdAt: fiche.createdAt,
              })),
            },
          },
        })
      }
    },
    { timeout: 60_000 },
  )
  console.log(`✅ ${plan.length} pré-dépôt(s) importé(s). Les postes les reçoivent à leur prochain poll.`)
}

main()
  .catch((error) => {
    console.error('❌ Erreur :', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
