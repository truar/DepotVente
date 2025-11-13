#!/usr/bin/env tsx
import { prisma } from 'database';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ID_FICHE = 0
const N_FICHE = 1
const NOM = 2
const ADRESSE = 3
const COTISATION = 4
const POSTE = 5
const ANNÉE = 6
const PRÉNOM = 7
const REGLEMENT = 7
const MONTANT_REGLEMENT = 9
const N_CH = 10
const HEURE = 11
const POSTE_RETOUR = 12
const SIGNATURE = 13
const HEURE_RETOUR = 14
const TEL_VENDEUR = 15
const TRANSFERT = 16
const CONNAISSANCE = 17
const ID_FICHE_PRE_DEPOT = 18

interface DepositData {
  lastName: string;
  firstName: string;
  phoneNumber: string;
  city?: string;
  postalCode?: string;
  contributionStatus: 'PAYEE' | 'A_PAYER' | 'GRATUIT';
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

const contributionStatuses = new Map(
  [
    ['Ext.1', 'GRATUIT'],
    ['Payé', 'PAYEE'],
    ['A Payer', 'A_PAYER'],
    ['Gratuit', 'GRATUIT'],
  ]
)

function parseToUTC(dateString: string): Date | undefined {
  if (!dateString || dateString.trim() === '') {
    return undefined;
  }

  try {
    // Parse MM/D/YYYY HH:MM format
    const [datePart, timePart] = dateString.split(' ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create date in local timezone, then convert to UTC
    // Return the date (JavaScript Date objects are already in UTC internally)
    return new Date(parseInt('20' + year), month - 1, day, hours, minutes);
  } catch (error) {
    console.warn(`⚠️  Failed to parse date: ${dateString}`);
    return undefined;
  }
}

function parseCSV(content: string): DepositData[] {
  const lines = content.split('\n').filter((line) => line.trim());

  return lines.slice(1).map((line) => {
    const values = line.split('\t').map((v) => v.trim());
    console.log(values)
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

async function importFiches() {
  try {
    const csvPath = path.join(__dirname, 'Fiche.tsv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`);
      process.exit(1);
    }

    console.log('📖 Reading Fiche.csv...');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const fiches = parseCSV(content);

    console.log(`📊 Found ${fiches.length} fiches to import`);

    let successCount = 0;
    let errorCount = 0;

    for (const fiche of fiches) {
      try {
        // First, create or find the contact
        const contact = await prisma.contact.create({
          data: {
            lastName: fiche.lastName,
            firstName: fiche.firstName,
            phoneNumber: fiche.phoneNumber,
            city: fiche.city,
            postalCode: fiche.postalCode,
          },
        });

        // Then create the deposit linked to this contact
        await prisma.deposit.create({
          data: {
            sellerId: contact.id,
            contributionStatus: fiche.contributionStatus || 'A_PAYER',
            depositIndex: fiche.depositIndex,
            incrementStart: fiche.incrementStart,
            dropWorkstationId: fiche.dropWorkstationId,
            collectWorkstationId: fiche.collectWorkstationId,
            collectedAt: fiche.collectedAt,
            paymentAmount: fiche.paymentAmount,
            chequeNumber: fiche.chequeNumber,
            signature: fiche.signature,
            createdAt: fiche.createdAt,
            updatedAt: fiche.updatedAt,
          },
        });

        successCount++;
        console.log(`✅ Imported fiche for ${fiche.firstName} ${fiche.lastName}`);
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error importing fiche for ${fiche.firstName} ${fiche.lastName}:`,
          error
        );
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${fiches.length}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
console.log('🚀 Starting Fiche import...\n');
importFiches();
