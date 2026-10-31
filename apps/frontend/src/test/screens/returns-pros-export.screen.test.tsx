import { beforeEach, describe, expect, it } from 'vitest'
import type { Article } from '@/db.ts'
import { YEAR, givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { lastDownloadedSheet } from '@/test/downloaded.ts'
import { returnsProsPage } from '@/test/pages/returns-pros.page.ts'
import { signedInAs } from '@/test/screen.tsx'

// After the sale, BRAVO (fiche 4) asks for the list of everything they
// brought, with what sold. ALPHA (fiche 3) is another professional.
describe('Screen: export the articles of a professional to Excel', () => {
  const saleId = '6f1c2b7e-4a39-4d0e-9a51-2f3b8c7d9e10'

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenDeposit(
      {
        depositIndex: 3,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'ALPHA', firstName: '' },
      },
      [{ price: 200 }],
    )
  })

  // Excel has no time zone: a date reads as the wall-clock time of the PC
  // that exported it. read-excel-file hands that wall clock back as UTC.
  const asExcelShowsIt = (date: Date) =>
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
      ),
    )

  it('downloads every article of the fiche, one line each, with VENDU OUI or NON', async () => {
    const depositedAt = new Date(YEAR, 9, 30, 6, 46, 35)
    const soldAt = new Date(YEAR, 9, 31, 15, 2, 9)
    // The second article came from another PC: the server sends its price
    // as a decimal string and its dates as ISO strings, stored as is.
    const pulledDepositedAt = `${YEAR}-10-30T05:47:12.000Z`
    const pulledReturnedAt = `${YEAR}-10-31T17:32:37.000Z`
    const bravo = await givenDeposit(
      {
        depositIndex: 4,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'BRAVO', firstName: '' },
      },
      [
        {
          status: 'SOLD',
          saleId,
          price: 115,
          category: 'Vêtement',
          discipline: 'Alpin',
          brand: 'Dare2b',
          model: 'Veste F',
          serialNumber: 'DWP619',
          size: '36',
          color: 'Noir',
          year: YEAR,
          // Shown to the cashier only: not part of the export.
          saleAlert: 'Vérifier la taille',
          createdAt: depositedAt,
          updatedAt: soldAt,
        },
        {
          status: 'RETURNED',
          price: '144.00' as unknown as number,
          category: 'Vêtement',
          discipline: 'Alpin',
          brand: 'Helly Hansen',
          model: 'Pantalon F',
          size: 'M',
          color: 'Noir',
          year: YEAR,
          createdAt: pulledDepositedAt as unknown as Date,
          updatedAt: pulledReturnedAt as unknown as Date,
        },
        {
          status: 'ABSENT',
          price: 60,
          category: 'Gants',
          discipline: 'Alpin',
          brand: 'Reusch',
          model: 'Moufles',
          size: '8',
          color: 'Bleu',
          year: YEAR - 1,
          createdAt: depositedAt,
          updatedAt: depositedAt,
        },
      ] satisfies Array<Partial<Article>>,
    )
    const [sold, returned, absent] = bravo.articles
    const page = await returnsProsPage()
    await page.pickPro('BRAVO')

    await page.exportExcel()

    const file = await lastDownloadedSheet()
    expect(file.fileName).toBe('articles-fiche-4-BRAVO.xlsx')
    expect(file.rows).toEqual([
      [
        'Code',
        'Prix',
        'Catégorie',
        'Discipline',
        'Marque',
        'Modèle',
        'N° de série',
        'Taille',
        'Couleur',
        'Année',
        'N° fiche',
        'Lettre',
        'N° article',
        'Statut',
        'VENDU',
        'Créé le',
        'Modifié le',
        'Supprimé le',
        'id',
        'depositId',
        'saleId',
      ],
      [
        sold.code,
        115,
        'Vêtement',
        'Alpin',
        'Dare2b',
        'Veste F',
        'DWP619',
        '36',
        'Noir',
        YEAR,
        4,
        'A',
        0,
        'Vendu',
        'OUI',
        asExcelShowsIt(depositedAt),
        asExcelShowsIt(soldAt),
        null,
        sold.id,
        bravo.deposit.id,
        saleId,
      ],
      [
        returned.code,
        144,
        'Vêtement',
        'Alpin',
        'Helly Hansen',
        'Pantalon F',
        null,
        'M',
        'Noir',
        YEAR,
        4,
        'B',
        1,
        'Restitué',
        'NON',
        asExcelShowsIt(new Date(pulledDepositedAt)),
        asExcelShowsIt(new Date(pulledReturnedAt)),
        null,
        returned.id,
        bravo.deposit.id,
        null,
      ],
      [
        absent.code,
        60,
        'Gants',
        'Alpin',
        'Reusch',
        'Moufles',
        null,
        '8',
        'Bleu',
        YEAR - 1,
        4,
        'C',
        2,
        'Absent',
        'NON',
        asExcelShowsIt(depositedAt),
        asExcelShowsIt(depositedAt),
        null,
        absent.id,
        bravo.deposit.id,
        null,
      ],
    ])
  })
})
