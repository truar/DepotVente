import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import fs from 'fs'

export interface PredepositData {
  predepositIndex: number
  lastName: string
  firstName: string
  phoneNumber: string
  city?: string
  createdAt?: Date
  updatedAt?: Date
}

const N_FICHE = 1
const NOM = 2
const ADRESSE = 3
const TEL_VENDEUR = 15

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function parseCSV(content: string): PredepositData[] {
  const lines = content.split('\n').filter((line) => line.trim())

  return lines.slice(1).map((line) => {
    const values = line.split('\t').map((v) => v.trim())
    const [lastName, ...firstName] = values[NOM].split(' ')

    return {
      lastName: lastName.trim(),
      firstName: firstName.join('').trim(),
      phoneNumber: values[TEL_VENDEUR],
      city: values[ADRESSE],
      predepositIndex: parseInt(values[N_FICHE]),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PredepositData
  })
}

export function extractPredeposits() {
  const csvPath = path.join(__dirname, 'Fiche_Pre-depot.tsv')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`)
    process.exit(1)
  }

  console.log('📖 Reading Fiche_Pre-depot.tsv...')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const fiches = parseCSV(content)

  console.log(`📊 Found ${fiches.length} fiches to import`)
  return fiches
}
