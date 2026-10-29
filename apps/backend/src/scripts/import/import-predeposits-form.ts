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
// Doublons : les réponses d'une même personne (mêmes nom, prénom et
// téléphone) sont fusionnées d'office en une fiche, coordonnées de la plus
// récente ; si elles ont les mêmes articles (formulaire renvoyé, voir
// articleKey dans predeposit-duplicates.ts), ils ne sont gardés qu'une fois. Les autres réponses qui partagent un
// téléphone, un email ou un nom + prénom sont signalées et jamais fusionnées
// d'office, pas plus qu'une même personne dont une partie seulement des
// articles se répète. Un même téléphone sous deux noms, ou ces articles en
// partie répétés, demandent d'appeler le vendeur. Ces doublons s'arbitrent
// dans DECISIONS (predeposit-decisions.ts) : réponse ignorée, gardée comme
// fiche distincte, ou fusionnée, repérée par son horodatage que la simulation
// affiche. Un groupe dont il ne reste qu'une réponse une fois les autres
// ignorées est arbitré ; un groupe non arbitré est importé en fiches
// distinctes.
//
// Tolérance : tout s'importe. Un champ sans correspondance dans une liste
// fermée est importé vide (la marque en « ? », la saisie en tête du
// descriptif), un prix illisible à 0. Chaque champ que le script n'a pas pu
// reprendre tel quel, et chaque doublon non arbitré, est noté au journal :
// <export>-journal.csv, à côté du CSV, écrit à chaque passage.
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
import { parseCsv } from './csv'
import { brandsByKey, findBrand } from './predeposit-brand'
import {
  type ArticleInput,
  duplicateReason,
  findDuplicates,
  type Response,
  sameSeller,
} from './predeposit-duplicates'
import { DECISIONS, formatTimestamp, parseTimestamp, resolveDecisions } from './predeposit-decisions'
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
  // Écrite « HERY » dans la liste jusqu'en octobre 2026.
  HERY: 'HERY SUR ALBY',
}

// ── Arguments ───────────────────────────────────────────────────────────────

const apply = process.argv.includes('--apply')
const csvArg = process.argv.slice(2).find((value) => !value.startsWith('--'))

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
const categoriesByKey = new Map(categories.map((category) => [key(category), category]))
const disciplinesByKey = new Map(disciplines.map((discipline) => [key(discipline), discipline]))
const colorsByKey = new Map(colors.map((color) => [key(color), color]))

function normalizeCity(value: string): string {
  const k = cityKey(value)
  const known = citiesByKey.get(k) ?? CITY_ALIASES[k]
  return known ?? value.toLocaleUpperCase('fr')
}

// `rest` : ce qui, dans le champ marque, n'est pas la marque (« AJ 3 » dans
// « ALPINA AJ 3 »), à mettre au descriptif.
function normalizeBrand(value: string): { brand: string; rest: string } {
  const { brand, rest } = findBrand(value)
  return brand === undefined ? { brand: titleCase(value), rest: '' } : { brand, rest }
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

// Nuances qui accompagnent une couleur sans en être une autre (« Bleu foncé »).
const COLOR_SHADES = new Set(['fonce', 'clair', 'fluo', 'pale', 'vif', 'marine'])

// « Bleu et rose », « Noir/orange », « Bleu marine » : des couleurs de la
// liste, avec leurs nuances. Gardé tel quel, lisible au poste, et pas
// signalé : rien à traiter.
function isColorMix(value: string): boolean {
  const words = stripAccents(value)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word !== '' && word !== 'et' && !COLOR_SHADES.has(word))
  return words.length >= 1 && words.every((word) => colorsByKey.has(key(word)) || key(word) in COLOR_ALIASES)
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

// Une ligne du journal : ce que le script a fait d'un champ qu'il n'a pas pu
// reprendre tel quel. Écrit à côté du CSV (même nom, suffixe -journal.csv),
// pour être traité à la main.
interface JournalEntry {
  line: number
  response: number
  seller: string
  article: string
  field: string
  input: string
  imported: string
  reason: string
}

interface Report {
  // Valeurs sans correspondance dans une liste fermée (type de matériel,
  // discipline, marque) ou illisibles (prix, horodatage) : importées vides,
  // « ? » ou 0, à traiter.
  errors: string[]
  warnings: string[]
  // Valeurs absentes d'une liste à suggestions (ville, couleur qui n'est pas un
  // mélange de couleurs de la liste) : le poste les affiche telles quelles,
  // mais il faut les relire.
  offList: string[]
  // Tailles dont normalizeSize a retiré des mots (« Pointure », un nom de
  // modèle…) : à relire, le mot retiré peut avoir sa place dans le descriptif.
  sizes: string[]
  // Champs marque dont une partie seulement est une marque (« ALPINA AJ 3 ») :
  // le reste est parti au descriptif, à relire.
  brands: string[]
  journal: JournalEntry[]
}

function readResponse(row: string[], number: number, report: Report): Response {
  // Ligne de la Google Sheet des réponses : l'en-tête est la ligne 1.
  const who = `ligne ${number + 1}, réponse ${number} (${clean(row[2])} ${clean(row[1])})`
  const note = (article: string, field: string, input: string, imported: string, reason: string) =>
    report.journal.push({ line: number + 1, response: number, seller: `${clean(row[2])} ${clean(row[1])}`, article, field, input, imported, reason })
  const createdAt = parseTimestamp(clean(row[0]))
  if (!createdAt) {
    report.errors.push(`${who} : horodatage illisible « ${row[0]} », remplacé par l'heure de l'import`)
    note('', 'horodatage', clean(row[0]), 'heure de l’import', 'illisible')
  }

  const phoneNumber = normalizePhone(row[3] ?? '')
  if (!/^0\d{9}$/.test(phoneNumber)) {
    report.warnings.push(`${who} : téléphone « ${clean(row[3])} » → « ${phoneNumber} », pas 10 chiffres`)
    note('', 'téléphone', clean(row[3]), phoneNumber, 'pas 10 chiffres')
  }

  const city = normalizeCity(clean(row[5]))
  if (city !== '' && !cities.includes(city)) {
    report.offList.push(`${who} : ville « ${clean(row[5])} »${suggest(clean(row[5]), citiesByKey, cityKey)}`)
    note('', 'ville', clean(row[5]), city, `hors liste${suggest(clean(row[5]), citiesByKey, cityKey)}`)
  }

  const articles: ArticleInput[] = []
  for (let start = SELLER_HEADERS.length; start < row.length; start += ARTICLE_HEADERS.length) {
    const [rawCategory, rawBrand, rawDiscipline, rawModel, rawColor, rawSize, rawPrice] = row
      .slice(start, start + 7)
      .map(clean)
    if (![rawCategory, rawBrand, rawDiscipline, rawModel, rawColor, rawSize, rawPrice].some(Boolean)) continue
    const letter = identificationLetter(articles.length)
    const where = `${who}, article ${letter}`

    // Sans correspondance dans une liste fermée, le champ est importé vide (la
    // marque en « ? ») et noté au journal : le poste le fait compléter au dépôt.
    let category = categoriesByKey.get(key(CATEGORY_MAP[rawCategory] ?? rawCategory)) ?? rawCategory
    if (!categories.includes(category)) {
      const hint = suggest(rawCategory, categoriesByKey)
      report.errors.push(`${where} : type de matériel inconnu « ${rawCategory} »${hint}, importé vide`)
      note(letter, 'type de matériel', rawCategory, '', `hors liste${hint}`)
      category = ''
    }

    let discipline = disciplinesByKey.get(key(DISCIPLINE_MAP[rawDiscipline] ?? rawDiscipline)) ?? rawDiscipline
    if (!disciplines.includes(discipline)) {
      const hint = suggest(rawDiscipline, disciplinesByKey)
      report.errors.push(`${where} : discipline inconnue « ${rawDiscipline} »${hint}, importée vide`)
      note(letter, 'discipline', rawDiscipline, '', `hors liste${hint}`)
      discipline = ''
    }

    // La marque est une liste fermée au poste, comme la catégorie et la
    // discipline. On vérifie la valeur finale, alias compris. Hors liste, elle
    // devient « ? » et ce que le vendeur a écrit passe en tête du descriptif,
    // pour rester lisible au dépôt. Le reste d'un champ dont une partie
    // seulement est une marque passe au descriptif, à la suite de celui du
    // vendeur.
    let { brand, rest } = normalizeBrand(rawBrand)
    let lead = ''
    if (!brands.includes(brand)) {
      const hint = suggest(rawBrand, brandsByKey)
      report.errors.push(`${where} : marque « ${rawBrand} » absente de la liste${hint}, importée « ? »`)
      note(letter, 'marque', rawBrand, '?', `hors liste${hint}, saisie gardée en tête du descriptif`)
      ;[brand, rest, lead] = ['?', '', rawBrand]
    } else if (rest !== '') {
      report.brands.push(`${where} : marque « ${rawBrand} » → ${brand}, « ${rest} » ajouté au descriptif`)
      note(letter, 'marque', rawBrand, brand, `marque trouvée dans une partie du champ, « ${rest} » ajouté au descriptif`)
    }
    const model = [lead, rawModel, rest].filter(Boolean).join(' ')

    let price = Number(rawPrice.replace(/[^\d,.]/g, '').replace(',', '.'))
    if (!(price > 0)) {
      report.errors.push(`${where} : prix « ${rawPrice} » illisible, importé à 0`)
      note(letter, 'prix', rawPrice, '0', 'illisible')
      price = 0
    }

    const color = rawColor === '' ? '' : normalizeColor(rawColor)
    if (color === '') report.warnings.push(`${where} : couleur vide, à compléter au dépôt`)
    else if (!colors.includes(color) && !isColorMix(rawColor)) {
      report.offList.push(`${where} : couleur « ${rawColor} »${suggest(rawColor, colorsByKey)}`)
      note(letter, 'couleur', rawColor, color, `hors liste${suggest(rawColor, colorsByKey)}`)
    }

    const { size, removed } = normalizeSize(rawSize)
    if (removed.length > 0) {
      report.sizes.push(`${where} : taille « ${rawSize} » → « ${size} », retiré : ${removed.join(', ')}`)
      note(letter, 'taille', rawSize, size, `mots retirés : ${removed.join(', ')}`)
    }

    articles.push({ category, discipline, brand, model, size, color, price })
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

const DUPLICATE_REASONS: Record<ReturnType<typeof duplicateReason>, string> = {
  'same-phone': '☎️  même téléphone, noms différents : appeler pour vérifier',
  'same-seller': '☎️  même personne, une partie des articles en double : appeler pour vérifier',
  other: 'même email ou même nom, téléphone différent',
}

function describe(response: Response): string {
  const date = response.createdAt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  const articles = response.articles.map((a) => `${a.category} ${a.brand} ${a.price}€`).join(', ')
  return (
    `réponse ${response.number} — ${date} (${formatTimestamp(response.createdAt)}) — ${response.lastName} ${response.firstName}, ` +
    `${response.phoneNumber}, ${response.email}, ${response.city}\n` +
    `        ${response.articles.length} article(s) : ${articles}`
  )
}

function csvField(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Le journal, à côté du CSV : même nom, suffixe -journal.csv. Il contient les
// noms des vendeurs, donc il reste dans tmp/, hors git, comme l'export.
function writeJournal(csvPath: string, journal: JournalEntry[]) {
  const journalPath = csvPath.replace(/\.csv$/i, '') + '-journal.csv'
  const header = ['Ligne Sheet', 'Réponse', 'Vendeur', 'Article', 'Champ', 'Saisi', 'Importé', 'Motif']
  const rows = [...journal]
    .sort((a, b) => a.line - b.line || a.article.localeCompare(b.article))
    .map((e) => [e.line, e.response, e.seller, e.article, e.field, e.input, e.imported, e.reason])
  fs.writeFileSync(journalPath, [header, ...rows].map((row) => row.map(csvField).join(',')).join('\n') + '\n')
  console.log(`📝 Journal : ${journal.length} ligne(s) dans ${journalPath}\n`)
}

// ── Programme ───────────────────────────────────────────────────────────────

async function main() {
  if (!csvArg) {
    console.error(
      'Usage : script:import-predeposits <export.csv> [--apply]',
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

  const report: Report = { errors: [], warnings: [], offList: [], sizes: [], brands: [], journal: [] }
  const allResponses = rows.map((row, index) => readResponse(row, index + 1, report))
  const byNumber = new Map(allResponses.map((response) => [response.number, response]))

  // Arbitrages, codés dans predeposit-decisions.ts
  const { merges, keeps, skips, errors: decisionErrors } = resolveDecisions(allResponses, DECISIONS)
  if (decisionErrors.length > 0) {
    console.error('❌ Arbitrages de predeposit-decisions.ts qui ne s’appliquent pas à cet export :')
    for (const error of decisionErrors) console.error(`   ${error}`)
    process.exit(1)
  }
  const decided = new Set<number>([...keeps, ...skips, ...merges.flat()])

  const duplicates = findDuplicates(allResponses)
  // Même personne (nom, prénom, téléphone) : une fiche, sans arbitrage.
  const { merges: sellerMerges } = sameSeller(allResponses, decided)
  const sameSellerNumbers = new Set(sellerMerges.flatMap(({ responses }) => responses.map((r) => r.number)))
  for (const n of sameSellerNumbers) decided.add(n)
  // Une fois les réponses ignorées retirées, un groupe réduit à une réponse
  // n'a plus de doublon.
  const isResolved = (group: Response[]) => {
    const left = group.filter((response) => !skips.has(response.number))
    return left.length < 2 || left.every((response) => decided.has(response.number))
  }
  const unresolved = duplicates.filter((group) => !isResolved(group))

  // Fiches à créer : réponses fusionnées, gardées, ou sans doublon ; les
  // réponses ignorées disparaissent. `origins` dit de quelles réponses vient
  // une fiche fusionnée, rangée sous le numéro de la plus récente.
  const merged = new Set([...merges.flat(), ...sameSellerNumbers])
  const origins = new Map<number, string>()
  const fiches: Response[] = []
  for (const group of merges) {
    const responses = group.map((n) => byNumber.get(n)!).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const latest = responses[responses.length - 1]
    fiches.push({
      ...latest,
      createdAt: responses[0].createdAt,
      articles: responses.flatMap((response) => response.articles),
    })
    origins.set(latest.number, `réponses ${group.join('+')}`)
  }
  for (const { responses, articles, repeated } of sellerMerges) {
    const latest = responses[responses.length - 1]
    fiches.push({ ...latest, createdAt: responses[0].createdAt, articles })
    origins.set(
      latest.number,
      `réponses ${responses.map((r) => r.number).join('+')}, même personne` +
        (repeated ? ', articles en double gardés une fois' : ''),
    )
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
    const origin = origins.get(fiche.number) ?? `réponse ${fiche.number}`
    console.log(
      `   ${String(predepositIndex).padStart(3)}  ${fiche.lastName} ${fiche.firstName} — ${fiche.phoneNumber} — ` +
        `${fiche.city} — ${articles.length} article(s) (${origin})`,
    )
  }
  console.log(`   Total : ${plan.reduce((sum, p) => sum + p.articles.length, 0)} article(s)\n`)

  if (duplicates.length > 0) {
    console.log(`👥 ${duplicates.length} groupe(s) de doublons (même téléphone, email ou nom) :`)
    for (const group of duplicates) {
      const status = !isResolved(group)
        ? `❓ non arbitré, gardé en fiches distinctes, ${DUPLICATE_REASONS[duplicateReason(group)]}`
        : group.every((response) => sameSellerNumbers.has(response.number))
          ? '✅ même personne, une seule fiche'
          : '✅ arbitré dans predeposit-decisions.ts'
      console.log(`   ${status} :`)
      for (const response of group) {
        const note = skips.has(response.number) ? ' [ignorée]' : keeps.has(response.number) ? ' [gardée]' : ''
        console.log(`      ${describe(response)}${note}`)
      }
    }
    console.log()
  }
  if (report.offList.length > 0) {
    console.log('🔎 Hors liste, gardé tel quel (à relire, corriger dans le CSV si besoin) :')
    for (const line of report.offList) console.log(`   ${line}`)
    console.log()
  }
  if (report.brands.length > 0) {
    console.log('🏷️  Marques trouvées dans une partie du champ, le reste ajouté au descriptif (à relire) :')
    for (const line of report.brands) console.log(`   ${line}`)
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

  // Rien de ce qui précède n'empêche l'import : les champs sans correspondance
  // sont importés vides, « ? » ou 0, et les doublons non arbitrés gardés en
  // fiches distinctes. Tout est noté au journal.
  if (report.errors.length > 0) {
    console.log('🛠️  Importé sans correspondance, à traiter (voir le journal) :')
    for (const line of report.errors) console.log(`   ${line}`)
    console.log()
  }
  for (const group of unresolved) {
    const reason = DUPLICATE_REASONS[duplicateReason(group)]
    const timestamps = group.map((r) => formatTimestamp(r.createdAt)).join(', ')
    for (const response of group.filter((r) => !skips.has(r.number))) {
      report.journal.push({
        line: response.number + 1,
        response: response.number,
        seller: `${response.lastName} ${response.firstName}`,
        article: '',
        field: 'doublon',
        input: `réponses ${group.map((r) => r.number).join(', ')}`,
        imported: 'fiche distincte',
        reason: `${reason} ; à arbitrer dans predeposit-decisions.ts (horodatages ${timestamps})`,
      })
    }
  }
  writeJournal(csvPath, report.journal)

  // Seul garde-fou : un second passage du script dupliquerait les fiches.
  const blockers: string[] = []
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
