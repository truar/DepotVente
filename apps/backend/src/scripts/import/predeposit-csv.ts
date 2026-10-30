// Les pré-dépôts au propre, en deux CSV qu'on relit et corrige à la main avant
// de les importer : predeposants.csv (une fiche par ligne) et articles.csv (un
// article par ligne, rattaché à sa fiche par le numéro).
//
// import-predeposits-form.ts --export=<dossier> les écrit à partir de l'export
// du Google Form, toutes les corrections faites ; import-predeposits-csv.ts
// les importe tels quels. Ils contiennent les coordonnées des vendeurs : ils
// restent dans tmp/, hors git.
import fs from 'fs'
import path from 'path'
import { parseCsv } from './csv'

export const SELLERS_FILE = 'predeposants.csv'
export const ARTICLES_FILE = 'articles.csv'

export const SELLER_COLUMNS = ['Fiche', 'Nom', 'Prénom', 'Téléphone', 'Ville', 'Date', 'Origine'] as const
export const ARTICLE_COLUMNS = [
  'Fiche',
  'Lettre',
  'Catégorie',
  'Discipline',
  'Marque',
  'Descriptif',
  'Taille',
  'Couleur',
  'Prix',
] as const

export type SellerRow = Record<(typeof SELLER_COLUMNS)[number], string>
export type ArticleRow = Record<(typeof ARTICLE_COLUMNS)[number], string>

function field(value: string | number): string {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// BOM en tête : Excel ouvre alors le fichier en UTF-8, accents compris.
function write(file: string, columns: readonly string[], rows: Record<string, string | number>[]) {
  const lines = [columns.join(','), ...rows.map((row) => columns.map((c) => field(row[c] ?? '')).join(','))]
  fs.writeFileSync(file, '﻿' + lines.join('\n') + '\n')
}

export function writePredepositCsv(
  dir: string,
  sellers: Record<(typeof SELLER_COLUMNS)[number], string | number>[],
  articles: Record<(typeof ARTICLE_COLUMNS)[number], string | number>[],
) {
  fs.mkdirSync(dir, { recursive: true })
  write(path.join(dir, SELLERS_FILE), SELLER_COLUMNS, sellers)
  write(path.join(dir, ARTICLES_FILE), ARTICLE_COLUMNS, articles)
}

// Lit un des deux fichiers. Les colonnes sont reconnues par leur nom, dans
// n'importe quel ordre ; une colonne manquante est une erreur. Le numéro de
// ligne rendu est celui du tableur (l'en-tête est la ligne 1).
export function readCsvFile<C extends string>(
  file: string,
  columns: readonly C[],
): { rows: { line: number; values: Record<C, string> }[]; errors: string[] } {
  const name = path.basename(file)
  if (!fs.existsSync(file)) return { rows: [], errors: [`${name} introuvable : ${file}`] }
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file))
  } catch {
    return { rows: [], errors: [`${name} n'est pas en UTF-8 : l'enregistrer en « CSV UTF-8 »`] }
  }
  const [header = [], ...data] = parseCsv(text)
  // Un tableur français enregistre parfois avec des points-virgules.
  if (header.length === 1 && header[0].includes(';')) {
    return { rows: [], errors: [`${name} est séparé par des points-virgules : l'enregistrer avec des virgules`] }
  }
  const names = header.map((h) => h.trim())
  const missing = columns.filter((c) => !names.includes(c))
  if (missing.length > 0) return { rows: [], errors: [`${name} : colonne(s) manquante(s) ${missing.join(', ')}`] }
  const index = Object.fromEntries(columns.map((c) => [c, names.indexOf(c)])) as Record<C, number>
  const rows = data.map((row, i) => ({
    line: i + 2,
    values: Object.fromEntries(columns.map((c) => [c, (row[index[c]] ?? '').trim()])) as Record<C, string>,
  }))
  return { rows, errors: [] }
}
