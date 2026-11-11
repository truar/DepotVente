import { describe, expect, it } from 'vitest'
import { ReturnDepositsPdf } from '@/pdf/return-deposit-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { YEAR } from '@/test/harness.ts'
import { lastPrintedImages } from '@/test/printed.ts'

// The club's logo heads every sheet the app prints, and a batch print (the
// evening's return sheets, the invoices of a day) carries it once per page:
// what it weighs is paid as many times as there are pages.
const returnSheet = (depositIndex: number) => ({
  deposit: {
    depositIndex,
    year: YEAR,
    contributionAmount: 2,
    contributionStatus: 'PAYE',
    clubAmount: 0,
    totalAmount: 120,
    dueAmount: 120,
    dueContributionAmount: 0,
    countSoldArticles: 1,
  },
  contact: {
    lastName: 'Durand',
    firstName: 'Camille',
    phoneNumber: '0600000000',
    city: 'Grenoble',
  },
})

describe('The club logo on a printed sheet', () => {
  it('heads every page of a batch print', async () => {
    await printPdf(<ReturnDepositsPdf data={[1001, 1002].map(returnSheet)} />)

    const pages = await lastPrintedImages()
    expect(pages).toHaveLength(2)
    for (const images of pages) expect(images).toHaveLength(1)
  })

  // Drawn 50 points wide (about 18 mm), 210 pixels are 300 dpi on paper:
  // as sharp as the printer goes, and five times lighter than the original.
  it('is no bigger than the paper can show', async () => {
    await printPdf(<ReturnDepositsPdf data={[returnSheet(1001)]} />)

    const [[logo]] = await lastPrintedImages()
    expect(logo.width).toBeLessThanOrEqual(210)
  })
})
