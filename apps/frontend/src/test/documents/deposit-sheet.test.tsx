import { beforeEach, describe, expect, it } from 'vitest'
import { DepositPdf } from '@/pdf/deposit-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { YEAR } from '@/test/harness.ts'
import { lastPrintedText } from '@/test/printed.ts'

// The sheet handed to a seller at the deposit desk. It is the same document
// for a private seller and for a professional, minus the two notices that
// only concern the club's own members.
const sheet = (type: 'PARTICULIER' | 'PRO') => ({
  deposit: {
    depositIndex: 1001,
    year: YEAR,
    contributionStatus: type === 'PRO' ? 'PRO' : 'PAYE',
    contributionAmount: type === 'PRO' ? 0 : 2,
    type,
  },
  contact: {
    lastName: 'Bernard',
    firstName: 'Paul',
    phoneNumber: '0622222222',
    city: 'Annecy',
  },
  articles: [
    {
      shortCode: '1001 A',
      category: 'Skis',
      brand: 'Rossignol',
      model: 'Hero',
      discipline: 'Alpin',
      size: '170',
      price: 120,
      color: 'rouge',
      isDeleted: false,
    },
  ],
})

async function print(type: 'PARTICULIER' | 'PRO') {
  await printPdf(<DepositPdf data={sheet(type)} />)
  return lastPrintedText()
}

describe('The deposit sheet', () => {
  let privateSeller: string
  let professional: string

  beforeEach(async () => {
    privateSeller = await print('PARTICULIER')
    professional = await print('PRO')
  })

  it('is the same sheet for both: seller, number and articles', () => {
    for (const text of [privateSeller, professional]) {
      expect(text).toContain('Fiche N° 1001')
      expect(text).toContain('BERNARD Paul')
      expect(text).toContain('1001 A Skis Rossignol Alpin rouge 170 Hero')
    }
  })

  it('tells a private seller when to collect what is left, and what the club announces', () => {
    expect(privateSeller).toContain(
      'Matériel à récupérer samedi soir entre 18h30 et 20h30',
    )
    expect(privateSeller).toContain('Information:')
  })

  // A shop does not come back on Saturday evening with the sellers, and the
  // announcements are addressed to members.
  it('says neither to a professional', () => {
    expect(professional).not.toMatch(/Matériel à récupérer/)
    expect(professional).not.toContain('Information:')
  })
})
