import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parseToUTC, shiftYearInText, TARGET_YEAR, toFloat } from './utils';
import path from 'path';
import fs from 'fs';
import { types } from './types';
import { materiels } from './materiels';
import { marques } from './marques';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VENDEUR = 0
const IDENTIFIANT_ARTICLE = 2
const ID_MATERIEL = 3
const ID_MARQUE = 4
const ID_TYPE = 5
const DESCRIPTIF = 6
const N_SERIE = 7
const COULEUR = 8
const TAILLE = 9
const PRIX = 10
const DATE = 11
const INDICE = 13
// Colonne « ReceptOK » de l'export : renseignée uniquement pour les articles
// des pros, qui sont les seuls à être scannés à la réception. Les articles des
// particuliers sont remis en main propre au moment du dépôt, donc la colonne
// reste vide pour eux.
const RECEPT_OK = 17


export interface ArticleData {
  price: number;
  category?: string;
  discipline?: string;
  brand: string;
  model?: string;
  serialNumber?: string | null;
  size: string;
  color: string;
  code: string;
  year: number;
  received: boolean;
  depositIndex: number;
  identificationLetter: string;
  articleIndex: number;
  createdAt?: Date;
  updatedAt?: Date
}

function parseCSV(content: string): ArticleData[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.slice(1).map((line, index) => {
    const values = line.split('\t').map((v) => v.trim());
    const articleCode = shiftYearInText(values[IDENTIFIANT_ARTICLE])
    return {
      price: toFloat(values[PRIX]),
      category: materiels[values[ID_MATERIEL]],
      discipline: types[values[ID_TYPE]],
      brand: marques[values[ID_MARQUE]],
      model: values[DESCRIPTIF],
      serialNumber: values[N_SERIE]?.trim() || null,
      size: values[TAILLE],
      color: values[COULEUR],
      code: articleCode,
      year: TARGET_YEAR,
      received: values[RECEPT_OK] === 'ReceptOK',
      depositIndex: parseInt(values[VENDEUR]),
      identificationLetter: values[INDICE],
      articleIndex: index,
      createdAt: parseToUTC(values[DATE]),
      updatedAt: parseToUTC(values[DATE]),
    } as ArticleData;
  });
}


export function extractArticles() {
  const csvPath = path.join(__dirname, 'Article.tsv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('📖 Reading Article.tsv...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const articles = parseCSV(content);

  console.log(`📊 Found ${articles.length} articles to import`);
  return articles;
}
