import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import { shiftYearInText } from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ID_ACHETEUR = 2
const CODE = 3

export type SoldArticleData = {
  code: string
  idBuyer: string
}

function parseCSV(content: string): SoldArticleData[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.slice(1).map((line) => {
    const values = line.split('\t').map((v) => v.trim());

    return {
      idBuyer: values[ID_ACHETEUR],
      code: shiftYearInText(values[CODE].toUpperCase()),
    } as SoldArticleData;
  });
}

export async function extractSoldArticles() {
  const csvPath = path.join(__dirname, 'ArticleAchete.tsv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('📖 Reading ArticleAchete.tsv...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const buyers = parseCSV(content);

  console.log(`📊 Found ${buyers.length} soldArticles to import`);
  return buyers;
}
