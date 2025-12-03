import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parseToUTC } from './utils';
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
const COULEUR = 8
const TAILLE = 9
const PRIX = 10
const DATE = 11
const INDICE = 13


export interface ArticleData {
  price: number;
  category?: string;
  discipline?: string;
  brand: string;
  model?: string;
  size: string;
  color: string;
  code: string;
  year: number;
  depositIndex: number;
  articleIndex: string;
  createdAt?: Date;
  updatedAt?: Date
}

function parseCSV(content: string): ArticleData[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.slice(1).map((line) => {
    const values = line.split('\t').map((v) => v.trim());
    const articleCode = values[IDENTIFIANT_ARTICLE]
    return {
      price: parseFloat(values[PRIX]),
      category: materiels[values[ID_MATERIEL]],
      discipline: types[values[ID_TYPE]],
      brand: marques[values[ID_MARQUE]],
      model: values[DESCRIPTIF],
      size: values[TAILLE],
      color: values[COULEUR],
      code: articleCode,
      year: 2025,
      depositIndex: parseInt(values[VENDEUR]),
      articleIndex: values[INDICE],
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
