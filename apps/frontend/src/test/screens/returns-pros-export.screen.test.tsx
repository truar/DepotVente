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

  it('downloads every article of the fiche, one line each, and nothing internal to our system', async () => {
    // The second article came from another PC: the server sends its price
    // as a decimal string, stored as is.
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
        'VENDU',
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
        'OUI',
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
        'NON',
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
        'NON',
      ],
    ])
  })
})
