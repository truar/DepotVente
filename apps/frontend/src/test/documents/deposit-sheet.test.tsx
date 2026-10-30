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

  it('is headed with the bourse and its year', () => {
    for (const text of [privateSeller, professional]) {
      expect(text).toContain(`Bourse aux skis ${YEAR}`)
    }
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
    expect(privateSeller).toContain('Information :')
  })

  // A shop does not come back on Saturday evening with the sellers, and the
  // announcements are addressed to members.
  it('says neither to a professional', () => {
    expect(professional).not.toMatch(/Matériel à récupérer/)
    expect(professional).not.toContain('Information :')
  })
})

// The same fiche reprinted once the bourse is under way: a line struck off
// at the desk stays on the sheet, struck through, but no longer counts.
const reprinted = (
  ...lines: Array<{ price: number; isDeleted?: boolean; isAbsent?: boolean }>
) => {
  const fiche = sheet('PARTICULIER')
  return {
    ...fiche,
    articles: lines.map((line, index) => ({
      ...fiche.articles[0],
      shortCode: `1001 ${String.fromCharCode(65 + index)}`,
      isDeleted: false,
      ...line,
    })),
  }
}

describe('A reprinted deposit sheet', () => {
  it('leaves a deleted article out of the count and of the subtotal', async () => {
    await printPdf(
      <DepositPdf
        data={reprinted({ price: 120 }, { price: 20, isDeleted: true })}
        showCategorySubtotals
      />,
    )
    const text = await lastPrintedText()

    expect(text).toContain('Nb articles : 1')
    expect(text).toContain('Sous-total Skis : 1 article 120,00 €')
  })

  // An article nowhere to be found goes the way of a deleted one, and the
  // last column says it is absent, as on the return sheet.
  it('strikes an absent article off like a deleted one, and says it is absent', async () => {
    await printPdf(
      <DepositPdf
        data={reprinted(
          { price: 120 },
          { price: 30, isAbsent: true },
          { price: 20, isDeleted: true },
        )}
        showCategorySubtotals
      />,
    )
    const text = await lastPrintedText()

    expect(text).toContain('Nb articles : 1')
    expect(text).toContain('Sous-total Skis : 1 article 120,00 €')
    expect(text).toMatch(/30,00 € Absent/)
    expect(text.match(/Absent/g)).toHaveLength(1)
  })
})
