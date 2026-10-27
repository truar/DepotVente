import { describe, expect, it } from 'vitest'
import { readProArticles } from '../src/scripts/import/pro-articles'

// Colonnes d'articles-pro.csv, tel que pros/decode_pro.py l'écrit.
const HEADER = [
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
  'Matériel (pro)',
  'Type (pro)',
  'Marque (pro)',
  'Couleur (pro)',
]

function row(fields: Record<string, string> = {}): string[] {
  const values: Record<string, string> = {
    Fiche: '1',
    Vendeur: 'ALPHA SPORT',
    Ville: 'ANNECY',
    Code: '2026 1A',
    Lettre: 'A',
    Catégorie: 'Skis',
    Discipline: 'Alpin',
    Marque: 'Rossignol',
    Descriptif: 'Hero',
    'N° série': '',
    Couleur: 'Noir',
    Taille: '150',
    Prix: '120',
    'Matériel (pro)': 'Skis',
    'Type (pro)': 'Alpin',
    'Marque (pro)': 'Rossignol',
    'Couleur (pro)': 'noir',
    ...fields,
  }
  return HEADER.map((column) => values[column])
}

describe('readProArticles (import des fiches des pros)', () => {
  it('regroupe les articles par fiche, dans l’ordre du fichier', () => {
    const result = readProArticles([
      HEADER,
      row(),
      row({ Code: '2026 1B', Lettre: 'B', Catégorie: 'Vêtement', Marque: 'Dare2b', Descriptif: 'Veste F', Taille: 'M', Prix: '115' }),
      row({ Fiche: '2', Vendeur: 'BRAVO SKI', Ville: 'SEVRIER', Code: '2026 2A' }),
    ])

    expect(result.errors).toEqual([])
    expect(result.year).toBe(2026)
    expect(result.fiches).toEqual([
      {
        number: 1,
        name: 'ALPHA SPORT',
        city: 'ANNECY',
        articles: [
          {
            code: '2026 1A',
            letter: 'A',
            category: 'Skis',
            discipline: 'Alpin',
            brand: 'Rossignol',
            model: 'Hero',
            serialNumber: null,
            size: '150',
            color: 'Noir',
            price: 120,
          },
          {
            code: '2026 1B',
            letter: 'B',
            category: 'Vêtement',
            discipline: 'Alpin',
            brand: 'Dare2b',
            model: 'Veste F',
            serialNumber: null,
            size: 'M',
            color: 'Noir',
            price: 115,
          },
        ],
      },
      {
        number: 2,
        name: 'BRAVO SKI',
        city: 'SEVRIER',
        articles: [expect.objectContaining({ code: '2026 2A', letter: 'A' })],
      },
    ])
  })

  // Le formulaire des pros accepte une couleur vide ; le n° de série est
  // imprimé sur l'étiquette à côté du descriptif.
  it('garde le n° de série et une couleur vide', () => {
    const { fiches, errors } = readProArticles([HEADER, row({ 'N° série': 'Legendary', Couleur: '' })])

    expect(errors).toEqual([])
    expect(fiches[0].articles[0]).toMatchObject({ serialNumber: 'Legendary', color: '' })
  })

  it.each([
    [{ Marque: 'Marque Inconnue' }, '2026 1A : marque « Marque Inconnue » absente de la liste de l’app'],
    [{ Catégorie: 'Surf' }, '2026 1A : catégorie « Surf » absente de la liste de l’app'],
    [{ Discipline: 'RA' }, '2026 1A : discipline « RA » absente de la liste de l’app'],
    [{ Prix: '0' }, '2026 1A : prix « 0 » illisible ou nul'],
    [{ Prix: 'abc' }, '2026 1A : prix « abc » illisible ou nul'],
    [{ Prix: '' }, '2026 1A : prix «  » illisible ou nul'],
    [{ Code: '2026 2A' }, 'ligne 2 : code « 2026 2A » ≠ année + fiche 1 + lettre A'],
    [{ Code: '2026 1A', Lettre: 'a' }, 'ligne 2 : code « 2026 1A » ≠ année + fiche 1 + lettre a'],
    [{ Fiche: '0', Code: '2026 0A' }, 'ligne 2 : fiche « 0 » illisible (1 à 999)'],
    [{ Fiche: '1000', Code: '2026 1000A' }, 'ligne 2 : fiche « 1000 » illisible (1 à 999)'],
    [{ Fiche: 'x' }, 'ligne 2 : fiche « x » illisible (1 à 999)'],
  ])('refuse un article invalide (%o)', (fields, error) => {
    expect(readProArticles([HEADER, row(fields)]).errors).toEqual([error])
  })

  it('refuse un code en double', () => {
    expect(readProArticles([HEADER, row(), row()]).errors).toEqual(['ligne 3 : code « 2026 1A » en double'])
  })

  it('refuse deux années dans le même fichier', () => {
    expect(readProArticles([HEADER, row(), row({ Code: '2025 1B', Lettre: 'B' })]).errors).toEqual([
      'ligne 3 : année 2025, les lignes précédentes sont en 2026',
    ])
  })

  it('refuse une fiche qui change de vendeur ou de ville en cours de route', () => {
    expect(
      readProArticles([HEADER, row(), row({ Code: '2026 1B', Lettre: 'B', Vendeur: 'CHARLIE GLISSE' })]).errors,
    ).toEqual(['ligne 3 : fiche 1 au nom de « CHARLIE GLISSE », « ALPHA SPORT » plus haut'])
    expect(readProArticles([HEADER, row(), row({ Code: '2026 1B', Lettre: 'B', Ville: 'THONES' })]).errors).toEqual([
      'ligne 3 : fiche 1 à « THONES », « ANNECY » plus haut',
    ])
  })

  it('refuse un fichier sans une colonne attendue', () => {
    const header = HEADER.filter((column) => column !== 'Marque')
    expect(readProArticles([header]).errors).toEqual(['colonne « Marque » absente'])
  })

  it('refuse un fichier sans article', () => {
    expect(readProArticles([HEADER])).toEqual({ year: undefined, fiches: [], errors: ['aucun article'] })
  })
})
