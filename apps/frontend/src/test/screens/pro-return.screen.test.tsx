import { beforeEach, describe, expect, it } from 'vitest'
import type { Article } from '@/db.ts'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { proReturnPage } from '@/test/pages/pro-return.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

const code = (depositIndex: number, letter: string) =>
  `${YEAR} ${depositIndex}${letter}`

const withStatus = (status: Article['status']): Partial<Article> => ({ status })

// The end of the sale at the professionals' desk: what ALLOSKI (fiche 3)
// deposited and did not sell goes back over the counter, scanned one article
// at a time. Its five articles are in the five states an article can be in.
async function givenAProfessionalToReturn() {
  await givenWorkstation(1000)
  const allosky = await givenDeposit(
    {
      depositIndex: 3,
      type: 'PRO',
      contributionStatus: 'PRO',
      seller: { lastName: 'Allo', firstName: 'Ski' },
    },
    [
      withStatus('RECEPTION_OK'),
      withStatus('RECEPTION_PENDING'),
      withStatus('SOLD'),
      withStatus('DELETED'),
      withStatus('RETURNED'),
    ],
  )
  const perrillat = await givenDeposit(
    {
      depositIndex: 2,
      type: 'PRO',
      contributionStatus: 'PRO',
      seller: { lastName: 'Perrillat', firstName: 'Sport' },
    },
    [withStatus('RECEPTION_OK')],
  )
  return { allosky, perrillat }
}

const statusOf = async (articleId: string) =>
  (await local.articles()).find((article) => article.id === articleId)?.status

describe('Screen: returning a professional’s unsold articles', () => {
  let day: Awaited<ReturnType<typeof givenAProfessionalToReturn>>

  beforeEach(async () => {
    signedInAs()
    day = await givenAProfessionalToReturn()
  })

  it('hands back a received article, and counts it', async () => {
    const page = await proReturnPage()
    await page.pickPro('Allo')
    expect(page.scannedCount()).toBe(1)
    expect(page.toReturnCount()).toBe(1)

    await page.scan(code(3, 'A'))

    await page.lastToast(`Retour de l'article ${code(3, 'A')} effectué`)
    expect(page.isAlertOpen()).toBe(false)
    expect(await statusOf(day.allosky.articles[0].id)).toBe('RETURNED')
    await waitFor(() => expect(page.scannedCount()).toBe(2))
    expect(page.toReturnCount()).toBe(0)
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([['articles', 'update']])
  })

  // Only a received article can go back to the professional: one never
  // checked in is not here, and a sold one left with a buyer. The volunteer
  // has the article in hand, so the message says what it is.
  it.each([
    [1, 'RECEPTION_PENDING', (c: string) => `L'article ${c} n'a pas été réceptionné`],
    [2, 'SOLD', (c: string) => `L'article ${c} a été vendu`],
    [3, 'DELETED', (c: string) => `L'article ${c} a été supprimé`],
    [4, 'RETURNED', (c: string) => `Retour de l'article ${c} déja effectué`],
  ] as const)(
    'refuses an article that is %s: %s',
    async (index, status, message) => {
      const article = day.allosky.articles[index]
      const page = await proReturnPage()
      await page.pickPro('Allo')

      await page.scan(article.code)

      const alert = await page.alert()
      expect(alert.message).toBe(message(article.code))
      await alert.dismiss()
      // Nothing written: not the article, not a line for the server.
      expect(await statusOf(article.id)).toBe(status)
      expect(await local.outbox()).toEqual([])
      expect(page.scanInput()).toBe('')
    },
  )

  it('refuses an article that belongs to another professional', async () => {
    const other = day.perrillat.articles[0]
    const page = await proReturnPage()
    await page.pickPro('Allo')

    await page.scan(other.code)

    const alert = await page.alert()
    expect(alert.message).toBe(
      `L'article ${other.code} n'appartient pas à ce dépôt`,
    )
    await alert.dismiss()
    expect(await statusOf(other.id)).toBe('RECEPTION_OK')
    expect(await local.outbox()).toEqual([])
  })

  it('refuses a code unknown to the app', async () => {
    const page = await proReturnPage()
    await page.pickPro('Allo')

    await page.scan(`${YEAR} 99Z`)

    const alert = await page.alert()
    expect(alert.message).toBe(`Article ${YEAR} 99Z inconnu`)
    await alert.dismiss()
    expect(await local.outbox()).toEqual([])
  })

  it('lists what is scanned and what is still waiting', async () => {
    const page = await proReturnPage()
    await page.pickPro('Allo')

    await page.showToScan()
    expect(page.listedCodes()).toEqual([code(3, 'A')])

    await page.scan(code(3, 'A'))
    await page.lastToast(`Retour de l'article ${code(3, 'A')} effectué`)
    expect(page.listedCodes()).toEqual([])

    await page.showScanned()
    expect(page.listedCodes().sort()).toEqual([code(3, 'A'), code(3, 'E')])
  })
})
