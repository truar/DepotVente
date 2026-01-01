import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import { toFloat } from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POSTE = 0
const MT_CAISSE_DEPOT = 1
const MT_DEPOT_LIQ = 2
const FONDS_DE_CAISSE_DEPOT = 3
const MT_DEPOT_THEO_LIQ = 4
const DIFF_DEPOT = 5
const NB_200 = 7
const NB_100 = 8
const NB_50 = 9
const NB_20 = 10
const NB_10 = 11
const NB_5 = 12
const NB_2 = 13
const NB_1 = 14
const NB_0_50 = 15
const NB_0_20 = 16
const NB_0_10 = 17
const NB_0_05 = 18
const NB_0_02 = 19
const NB_0_01 = 20

export type CashRegisterDeposit = {
  cashRegisterId: number
  initialAmount: number
  theoreticalAmount: number
  realCashAmount: number
  difference: number
  totalAmount: number
  cash200: number
  cash100: number
  cash50: number
  cash20: number
  cash10: number
  cash5: number
  cash2: number
  cash1: number
  cash050: number
  cash020: number
  cash010: number
  cash005: number
  cash002: number
  cash001: number
}

function parseCSV(content: string): CashRegisterDeposit[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.slice(1).map((line) => {
    const values = line.split('\t').map((v) => v.trim());

    return {
      cashRegisterId: parseInt(values[POSTE]),
      initialAmount: toFloat(values[FONDS_DE_CAISSE_DEPOT]),
      theoreticalAmount: toFloat(values[MT_DEPOT_THEO_LIQ] || '0'),
      realCashAmount: toFloat(values[MT_DEPOT_LIQ]),
      difference: toFloat(values[DIFF_DEPOT] || '0'),
      totalAmount: toFloat(values[MT_CAISSE_DEPOT]),
      cash200: parseInt(values[NB_200]),
      cash100: parseInt(values[NB_100]),
      cash50: parseInt(values[NB_50]),
      cash20: parseInt(values[NB_20]),
      cash10: parseInt(values[NB_10]),
      cash5: parseInt(values[NB_5]),
      cash2: parseInt(values[NB_2]),
      cash1: parseInt(values[NB_1]),
      cash050: parseInt(values[NB_0_50]),
      cash020: parseInt(values[NB_0_20]),
      cash010: parseInt(values[NB_0_10]),
      cash005: parseInt(values[NB_0_05]),
      cash002: parseInt(values[NB_0_02]),
      cash001: parseInt(values[NB_0_01]),
    } as CashRegisterDeposit
  });
}

export async function extractCashRegisterDeposits() {
  const csvPath = path.join(__dirname, 'Caisse_Depot.tsv');

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
