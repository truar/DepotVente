// Pré-dépôts ajoutés à l'import, absents de l'export d'origine.
//
// L'export 2025 ne laisse que 4 pré-dépôts non confirmés (n° 22, 30, 40 et 57),
// soit 14 articles : bien trop peu pour répéter le dépôt d'un pré-dépôt sur
// plusieurs postes. Plutôt que de retirer des fiches déjà importées — ce qui
// creuserait des trous dans la numérotation des dépôts, et donc ferait
// réattribuer des numéros de fiche déjà utilisés et des codes-barres en double —
// on ajoute des pré-dépôts neufs, sans dépôt associé.
//
// Ils ne sont créés qu'en mode --depot-state, pour que le rejeu complet reste
// fidèle à l'export. Leur numéro de fiche est attribué à la suite de ceux du
// fichier (voir importExtraPredeposits dans import.ts).
//
// Les catégories viennent de materiels.ts, les disciplines de types.ts et les
// marques de marques.ts : ce sont les mêmes valeurs que celles produites par
// l'extraction, pour que les articles se comportent comme les autres.

export interface ExtraPredepositArticleData {
  price: number
  category: string
  discipline: string
  brand: string
  model: string
  size: string
  color: string
  identificationLetter: string
}

export interface ExtraPredepositData {
  lastName: string
  firstName: string
  phoneNumber: string
  city: string
  articles: ExtraPredepositArticleData[]
}

export const extraPredeposits: ExtraPredepositData[] = [
  {
    lastName: 'MARTIN',
    firstName: 'Camille',
    phoneNumber: '0600000060',
    city: 'Grenoble',
    articles: [
      {
        price: 60,
        category: 'Skis',
        discipline: 'Alpin',
        brand: 'Rossignol',
        model: 'Experience 76',
        size: '150',
        color: 'Rouge',
        identificationLetter: 'A',
      },
      {
        price: 35,
        category: 'Chaussures',
        discipline: 'Alpin',
        brand: 'Salomon',
        model: 'X Access 70',
        size: '38',
        color: 'Noir',
        identificationLetter: 'B',
      },
      {
        price: 10,
        category: 'Bâtons',
        discipline: 'Alpin',
        brand: 'Leki',
        model: 'Rider',
        size: '110',
        color: 'Bleu',
        identificationLetter: 'C',
      },
      {
        price: 25,
        category: 'Vêtement',
        discipline: 'Alpin',
        brand: 'Millet',
        model: 'Veste Atna',
        size: '12 ans',
        color: 'Vert',
        identificationLetter: 'D',
      },
      {
        price: 15,
        category: 'Casque',
        discipline: 'Alpin',
        brand: 'Uvex',
        model: 'Heyya',
        size: '52',
        color: 'Blanc',
        identificationLetter: 'E',
      },
    ],
  },
  {
    lastName: 'BERNARD',
    firstName: 'Julien',
    phoneNumber: '0600000061',
    city: 'Chambéry',
    articles: [
      {
        price: 80,
        category: 'Skis',
        discipline: 'Alpin',
        brand: 'Atomic',
        model: 'Redster S9',
        size: '170',
        color: 'Rouge',
        identificationLetter: 'A',
      },
      {
        price: 45,
        category: 'Chaussures',
        discipline: 'Alpin',
        brand: 'Lange',
        model: 'RX 120',
        size: '42',
        color: 'Bleu',
        identificationLetter: 'B',
      },
      {
        price: 90,
        category: 'Surf',
        discipline: 'Snowboard',
        brand: 'Burton',
        model: 'Custom',
        size: '155',
        color: 'Noir',
        identificationLetter: 'C',
      },
      {
        price: 30,
        category: 'Boots',
        discipline: 'Snowboard',
        brand: 'Burton',
        model: 'Moto Boa',
        size: '43',
        color: 'Gris',
        identificationLetter: 'D',
      },
    ],
  },
]
