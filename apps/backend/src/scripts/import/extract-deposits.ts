import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { parseToUTC } from './utils';
import fs from 'fs';

export interface DepositData {
  lastName: string;
  firstName: string;
  phoneNumber: string;
  city?: string;
  postalCode?: string;
  contributionStatus: 'PAYEE' | 'A_PAYER' | 'GRATUIT' | 'PRO';
  depositIndex: number;
  incrementStart: number;
  dropWorkstationId: number;
  collectWorkstationId?: number;
  collectedAt?: Date;
  paymentAmount?: number;
  chequeNumber?: string;
  signature?: string;
  createdAt?: Date;
  updatedAt?: Date
}

const N_FICHE = 1
const NOM = 2
const ADRESSE = 3
const COTISATION = 4
const POSTE = 5
const MONTANT_REGLEMENT = 9
const N_CH = 10
const HEURE = 11
const POSTE_RETOUR = 12
const SIGNATURE = 13
const HEURE_RETOUR = 14
const TEL_VENDEUR = 15

export const contributionStatuses = new Map(
  [
    ['Ext.1', 'PRO'],
    ['Payé', 'PAYEE'],
    ['A Payer', 'A_PAYER'],
    ['Gratuit', 'GRATUIT'],
  ]
)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseCSV(content: string): DepositData[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.slice(1).map((line) => {
    const values = line.split('\t').map((v) => v.trim());
    const [lastName, ...firstName] = values[NOM].split(' ')

    return {
      lastName: lastName.trim(),
      firstName: firstName.join('').trim(),
      phoneNumber: values[TEL_VENDEUR],
      city: values[ADRESSE],
      postalCode: undefined,
      contributionStatus: contributionStatuses.get(values[COTISATION]) || 'A_PAYER',
      depositIndex: parseInt(values[N_FICHE]),
      incrementStart: parseInt(values[POSTE]),
      dropWorkstationId: parseInt(values[POSTE]),
      collectWorkstationId: parseInt(values[POSTE_RETOUR]),
      collectedAt: parseToUTC(values[HEURE_RETOUR]),
      paymentAmount: parseFloat(values[MONTANT_REGLEMENT]),
      chequeNumber: values[N_CH],
      signature: values[SIGNATURE],
      createdAt: parseToUTC(values[HEURE_RETOUR].split(' ')[0] + ' ' + values[HEURE]),
      updatedAt: parseToUTC(values[HEURE_RETOUR].split(' ')[0] + ' ' + values[HEURE]),
    } as DepositData;
  });
}

export function extractDeposits() {
  const csvPath = path.join(__dirname, 'Fiche.tsv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log('📖 Reading Fiche.csv...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const fiches = parseCSV(content);

  console.log(`📊 Found ${fiches.length} fiches to import`);
  return fiches;
}
