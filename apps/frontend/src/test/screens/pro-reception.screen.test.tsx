import { beforeEach, describe, expect, it } from 'vitest'
import type { Article } from '@/db.ts'
import { categories } from '@/types/categories.ts'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { proReceptionPage } from '@/test/pages/pro-reception.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// Articles arrive at the desk in category groups: all the skis, then all
// the boots. Everything a professional deposits starts pending until it is
// scanned in.
const pending = (category: string, price: number): Partial<Article> => ({
  category,
  price,
  status: 'RECEPTION_PENDING',
})

const code = (depositIndex: number, letter: string) =>
  `${YEAR} ${depositIndex}${letter}`

// ALLOSKI (fiche 3) brings two pairs of skis and two pairs of boots.
// PERRILLAT (fiche 2) is the other professional of the day.
async function givenTwoProfessionals() {
  await givenWorkstation(1000)
  const allosky = await givenDeposit(
    {
      depositIndex: 3,
      type: 'PRO',
      contributionStatus: 'PRO',
      seller: { lastName: 'Allo', firstName: 'Ski' },
    },
    [
      pending('Skis', 200),
      pending('Skis', 150),
      pending('Chaussures', 80),
      pending('Chaussures', 60),
    ],
  )
  const perrillat = await givenDeposit(
    {
      depositIndex: 2,
      type: 'PRO',
      contributionStatus: 'PRO',
      seller: { lastName: 'Perrillat', firstName: 'Sport' },
    },
    [pending('Skis', 300)],
  )
  return { allosky, perrillat }
}

const statusOf = async (articleId: string) =>
  (await local.articles()).find((article) => article.id === articleId)?.status

describe('Screen: receiving a professional’s articles', () => {
  let day: Awaited<ReturnType<typeof givenTwoProfessionals>>

  beforeEach(async () => {
    signedInAs()
    day = await givenTwoProfessionals()
  })

  it('starts with nothing received and the whole deposit to check in', async () => {
    const page = await proReceptionPage()
    await page.pickPro('Allo')

    expect(page.scannedCount()).toBe(0)
    expect(page.totalCount()).toBe(4)
    // The received list is empty; everything is on the pending one.
    expect(page.listedCodes()).toEqual([])
    await page.showPending()
    await waitFor(() => expect(page.listedCodes()).toHaveLength(4))
  })

  it('receives a scanned article, moves the count, and lists it under its category', async () => {
    const page = await proReceptionPage()
    await page.pickPro('Allo')

    await page.scan(code(3, 'A'))
    await page.lastToast(`Dépôt de l'article ${code(3, 'A')} effectué`)

    await waitFor(() => expect(page.scannedCount()).toBe(1))
    expect(page.totalCount()).toBe(4)
    await page.listShows([code(3, 'A')])
    expect(page.listedCategories()).toEqual(['Skis'])
    // The scanner is ready for the next article.
    expect(page.scanInput()).toBe('')

    await page.showPending()
    await waitFor(() => expect(page.listedCodes()).toHaveLength(3))
    expect(page.listedCodes()).not.toContain(code(3, 'A'))
  })

  // The desk works category by category: the skis, then the boots. Each
  // article joins the received list under its own category.
  it('keeps the list grouped by category as the groups are scanned', async () => {
    const page = await proReceptionPage()
    await page.pickPro('Allo')

    // The two pairs of skis
    await page.scan(code(3, 'A'))
    await page.scan(code(3, 'B'))
    await waitFor(() => expect(page.scannedCount()).toBe(2))
    expect(page.listedCategories()).toEqual(['Skis', 'Skis'])

    // Then the two pairs of boots
    await page.scan(code(3, 'C'))
    await page.scan(code(3, 'D'))
    await waitFor(() => expect(page.scannedCount()).toBe(4))

    expect(page.listedCategories()).toEqual([
      'Chaussures',
      'Chaussures',
      'Skis',
      'Skis',
    ])
    expect(page.listedCodes()).toEqual([
      code(3, 'D'),
      code(3, 'C'),
      code(3, 'B'),
      code(3, 'A'),
    ])
    await page.showPending()
    await waitFor(() => expect(page.listedCodes()).toEqual([]))
  })

  // A volunteer picks the category they are about to scan, before any
  // article of it is on the list. Filtering on a category with nothing left
  // to receive is how the desk checks a group is finished.
  it('offers every category in the filter, even those with nothing to scan', async () => {
    const page = await proReceptionPage()
    await page.pickPro('Allo')
    await page.showPending()
    await waitFor(() => expect(page.listedCodes()).toHaveLength(4))

    const options = await page.categoryFilterOptions()

    // The list holds skis and boots only; the filter offers the lot.
    expect(page.listedCategories()).toEqual([
      'Chaussures',
      'Chaussures',
      'Skis',
      'Skis',
    ])
    expect(options).toContain('Toutes')
    for (const category of categories) {
      expect(options).toContain(category)
    }
  })

  it('refuses an article that belongs to another professional', async () => {
    const page = await proReceptionPage()
    await page.pickPro('Allo')

    await page.scan(code(2, 'A'))

    const alert = await page.alert()
    expect(alert.message).toBe(
      `L'article ${code(2, 'A')} n'appartient pas à ce professionnel`,
    )
    await alert.dismiss()

    expect(page.scannedCount()).toBe(0)
    expect(page.listedCodes()).toEqual([])
    expect(page.scanInput()).toBe('')
    await expect(statusOf(day.perrillat.articles[0].id)).resolves.toBe(
      'RECEPTION_PENDING',
    )
  })

  it('refuses an article already received, and does not count it twice', async () => {
    const page = await proReceptionPage()
    await page.pickPro('Allo')
    await page.scan(code(3, 'A'))
    await waitFor(() => expect(page.scannedCount()).toBe(1))

    await page.scan(code(3, 'A'))

    const alert = await page.alert()
    expect(alert.message).toBe(
      `Dépôt de l'article ${code(3, 'A')} déja effectué`,
    )
    await alert.dismiss()

    expect(page.scannedCount()).toBe(1)
    await page.listShows([code(3, 'A')])
  })

  it.each([
    [
      'unknown to the app',
      'inconnu-code',
      (c: string) => `Article ${c} inconnu`,
    ],
  ])('refuses a code %s', async (_label, scanned, message) => {
    const page = await proReceptionPage()
    await page.pickPro('Allo')

    await page.scan(scanned)

    const alert = await page.alert()
    expect(alert.message).toBe(message(scanned))
    await alert.dismiss()
    expect(page.scannedCount()).toBe(0)
  })

  it.each([
    ['SOLD', (c: string) => `L'article ${c} a déjà été vendu`],
    ['DELETED', (c: string) => `L'article ${c} a été supprimé`],
    ['RETURNED', (c: string) => `L'article ${c} a été restitué`],
  ] as const)('refuses a %s article', async (status, message) => {
    await givenDeposit(
      {
        depositIndex: 9,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Neuf', firstName: 'Pro' },
      },
      [{ status, category: 'Skis' }],
    )
    const page = await proReceptionPage()
    await page.pickPro('Neuf')

    await page.scan(code(9, 'A'))

    const alert = await page.alert()
    expect(alert.message).toBe(message(code(9, 'A')))
    await alert.dismiss()
    // A sold or deleted article already counts as checked in.
    expect(page.scannedCount()).toBe(1)
  })
})
