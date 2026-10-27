// Articles des pros, décodés et vérifiés par pros/decode_pro.py
// (articles-pro.csv) → fiches à importer.
//
// Le décodage a déjà tout contrôlé contre le référentiel ; on revérifie ici ce
// qui compte pour l'app, au cas où le fichier aurait été retouché à la main
// entre les deux : valeurs dans les listes de l'app, codes conformes et
// uniques, prix lisibles, une fiche = un seul pro.
import { brands } from '../../../../frontend/src/types/brands'
import { categories } from '../../../../frontend/src/types/categories'
import { disciplines } from '../../../../frontend/src/types/disciplines'

export type ProArticle = {
  code: string
  letter: string
  category: string
  discipline: string
  brand: string
  model: string
  serialNumber: string | null
  size: string
  color: string
  price: number
}

export type ProFiche = {
  number: number
  name: string
  city: string
  articles: ProArticle[]
}

const COLUMNS = [
  'Fiche',
  'Vendeur',
  'Ville',
  'Code',
  'Lettre',
  'Catégorie',
  'Discipline',
  'Marque',
  'Descriptif',
  'N° série',
  'Couleur',
  'Taille',
  'Prix',
] as const

export function readProArticles(rows: string[][]): {
  year: number | undefined
  fiches: ProFiche[]
  errors: string[]
} {
  const [header = [], ...lines] = rows
  const errors = COLUMNS.filter((column) => !header.includes(column)).map((column) => `colonne « ${column} » absente`)
  if (errors.length > 0) return { year: undefined, fiches: [], errors }
  if (lines.length === 0) return { year: undefined, fiches: [], errors: ['aucun article'] }

  let year: number | undefined
  const fiches = new Map<number, ProFiche>()
  const codes = new Set<string>()
  lines.forEach((line, index) => {
    const value = (column: (typeof COLUMNS)[number]) => (line[header.indexOf(column)] ?? '').trim()
    const where = `ligne ${index + 2}`

    const number = Number(value('Fiche'))
    if (!Number.isInteger(number) || number < 1 || number > 999) {
      errors.push(`${where} : fiche « ${value('Fiche')} » illisible (1 à 999)`)
      return
    }
    const code = value('Code')
    const letter = value('Lettre')
    const match = code.match(/^(\d{4}) (\d+)([A-Z]+)$/)
    if (!match || Number(match[2]) !== number || match[3] !== letter) {
      errors.push(`${where} : code « ${code} » ≠ année + fiche ${number} + lettre ${letter}`)
      return
    }
    if (year !== undefined && Number(match[1]) !== year) {
      errors.push(`${where} : année ${match[1]}, les lignes précédentes sont en ${year}`)
      return
    }
    year = Number(match[1])
    if (codes.has(code)) {
      errors.push(`${where} : code « ${code} » en double`)
      return
    }
    codes.add(code)

    const name = value('Vendeur')
    const city = value('Ville')
    const fiche = fiches.get(number) ?? { number, name, city, articles: [] }
    fiches.set(number, fiche)
    if (fiche.name !== name) errors.push(`${where} : fiche ${number} au nom de « ${name} », « ${fiche.name} » plus haut`)
    if (fiche.city !== city) errors.push(`${where} : fiche ${number} à « ${city} », « ${fiche.city} » plus haut`)

    const category = value('Catégorie')
    const discipline = value('Discipline')
    const brand = value('Marque')
    if (!categories.includes(category)) errors.push(`${code} : catégorie « ${category} » absente de la liste de l’app`)
    if (!disciplines.includes(discipline)) errors.push(`${code} : discipline « ${discipline} » absente de la liste de l’app`)
    if (!brands.includes(brand)) errors.push(`${code} : marque « ${brand} » absente de la liste de l’app`)
    const price = Number(value('Prix'))
    if (!(price > 0)) errors.push(`${code} : prix « ${value('Prix')} » illisible ou nul`)

    fiche.articles.push({
      code,
      letter,
      category,
      discipline,
      brand,
      model: value('Descriptif'),
      serialNumber: value('N° série') || null,
      size: value('Taille'),
      color: value('Couleur'),
      price,
    })
  })
  return { year, fiches: [...fiches.values()], errors }
}
