import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import { parseToUTC } from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ID_ACHETEUR = 0
const NOM = 1
const ANNEE = 2
const REGLEMENT = 3
const MONTANT_ACHAT = 4
const POSTE = 5
const DATE = 6
const TEL_ACHETEUR = 7
const ADRESSE_ACHETEUR = 10

export type BuyerData = {
  idBuyer: string
  lastName: string
  firstName: string
  phoneNumber: string
  city?: string
  year: number
  paymentAmount: number
  paymentMethod: string
  createdAt: Date
  updatedAt: Date
  soldAt: Date
}

function parseCSV(content: string): BuyerData[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.slice(1).map((line) => {
    const values = line.split('\t').map((v) => v.trim());
    const [lastName, ...firstName] = values[NOM].split(' ')

    return {
      idBuyer: values[ID_ACHETEUR],
      lastName: lastName.trim(),
      firstName: firstName.join('').trim(),
      phoneNumber: values[TEL_ACHETEUR],
      city: values[ADRESSE_ACHETEUR],
      year: parseInt(values[ANNEE]),
      incrementStart: parseInt(values[POSTE]),
      soldAt: parseToUTC(values[DATE]),
      createdAt: parseToUTC(values[DATE]),
      updatedAt: parseToUTC(values[DATE]),
      paymentAmount: parseFloat(values[MONTANT_ACHAT]),
      paymentMethod: values[REGLEMENT],
    } as BuyerData;
  });
}

export async function extractBuyers() {
  const csvPath = path.join(__dirname, 'Acheteur.tsv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('📖 Reading Fiche.csv...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const buyers = parseCSV(content);

  console.log(`📊 Found ${buyers.length} buyers to import`);
  return buyers;
}
