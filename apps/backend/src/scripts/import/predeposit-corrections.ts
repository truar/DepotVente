// Corrections article par article, relues dans le doc « Descriptifs des
// pré-dépôts » puis exportées en Markdown (le tableau de 399 lignes et plus).
//
// Une ligne du tableau désigne un article par son N° « réponse.article » :
// numéro de la réponse dans l'export (1 = première ligne sous l'en-tête) et
// rang de l'article dans la réponse (1 = premier bloc rempli). Ces numéros
// bougent si une ligne est supprimée du Sheet : chaque ligne porte aussi le
// vendeur et le descriptif saisi, qui doivent correspondre à l'export, sinon la
// correction est écartée et notée au journal.
//
// Colonnes lues, repérées par leur titre (les autres sont ignorées) :
//   N°, Vendeur, DESC originale  — repérage et contrôle, jamais importés
//   Catégorie                    — type de matériel ; « Vêtement → Gants » donne
//                                  « Gants »
//   Marque, Taille               — à la place de la saisie, normalisées comme elle
//   DESC proposé                 — le descriptif importé ; « — » ou vide = aucun
//
// Le fichier contient les noms des vendeurs : il reste dans tmp/, hors git.
import fs from 'fs'

export interface Correction {
  // « 31.12 », pour les messages.
  label: string
  seller: string
  originalModel: string
  category?: string
  brand?: string
  size?: string
  model?: string
}

export const REFUSED_MODEL = 'A supprimer'

const COLUMNS = {
  number: 'N°',
  seller: 'Vendeur',
  category: 'Catégorie',
  brand: 'Marque',
  size: 'Taille',
  originalModel: 'DESC originale',
  model: 'DESC proposé',
} as const

// « | a | b \| c | » → ['a', 'b | c'] ; l'export Markdown échappe les « | »
// des cellules.
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, '|').replace(/\\(?=[\\`*_{}[\]()#+\-.!<>~])/g, '').trim())
}

function isSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line.trim())
}

// Les corrections du fichier, par clé « réponse.article ». Le premier tableau
// dont l'en-tête a les colonnes N°, Vendeur et DESC originale est retenu.
export function readCorrections(filePath: string): Map<string, Correction> {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (let i = 0; i + 1 < lines.length; i++) {
    if (!lines[i].trim().startsWith('|') || !isSeparator(lines[i + 1])) continue
    const header = cells(lines[i])
    const at = (title: string) => header.indexOf(title)
    if (at(COLUMNS.number) === -1 || at(COLUMNS.seller) === -1 || at(COLUMNS.originalModel) === -1) continue

    const corrections = new Map<string, Correction>()
    for (const line of lines.slice(i + 2)) {
      if (!line.trim().startsWith('|')) break
      const row = cells(line)
      const get = (title: string) => (at(title) === -1 ? undefined : (row[at(title)] ?? ''))
      const label = get(COLUMNS.number)!
      if (!/^\d+\.\d+$/.test(label)) continue
      const category = get(COLUMNS.category)
      const model = get(COLUMNS.model)
      corrections.set(label, {
        label,
        seller: get(COLUMNS.seller)!,
        originalModel: get(COLUMNS.originalModel)!,
        category: category === undefined ? undefined : category.split('→').pop()!.trim(),
        brand: get(COLUMNS.brand),
        size: get(COLUMNS.size),
        model: model === undefined ? undefined : model === '—' || model === '-' ? '' : model,
      })
    }
    return corrections
  }
  throw new Error(`aucun tableau avec les colonnes ${COLUMNS.number}, ${COLUMNS.seller} et ${COLUMNS.originalModel} dans ${filePath}`)
}

export function correctionKey(response: number, article: number): string {
  return `${response}.${article}`
}
