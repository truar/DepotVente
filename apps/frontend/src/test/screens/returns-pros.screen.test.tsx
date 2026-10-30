import { beforeEach, describe, expect, it } from 'vitest'
import type { Article } from '@/db.ts'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { depositEditPage } from '@/test/pages/deposit-edit.page.ts'
import { returnsProsPage } from '@/test/pages/returns-pros.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// At the end of the sale, BRAVO (fiche 4) comes back for the two pairs
// of skis nobody bought. ALPHA (fiche 3) is the other professional.
describe('Screen: return the unsold articles to a professional', () => {
  let bravoCodes: Array<string>
  let alphaCode: string

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    const alpha = await givenDeposit(
      {
        depositIndex: 3,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Alpha', firstName: 'Ski' },
      },
      [{ price: 200 }],
    )
    const bravo = await givenDeposit(
      {
        depositIndex: 4,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Bravo', firstName: 'Jean' },
      },
      [{ price: 90 }, { price: 70 }],
    )
    bravoCodes = bravo.articles.map((a) => a.code)
    alphaCode = alpha.articles[0].code
  })

  it('opens the professional picked in the list, then scans their articles out', async () => {
    const page = await returnsProsPage()
    expect(page.isScanOpen()).toBe(false)
    // Picking a professional is enough: there is no "Valider" after it.
    expect(page.hasButton('Valider')).toBe(false)

    await page.pickPro('Bravo')

    expect(page.selectedPro()).toBe('4 - Jean Bravo')
    expect(page.returnedCount()).toBe(0)
    expect(page.toReturnCount()).toBe(2)

    await page.scan(bravoCodes[0])

    await waitFor(() => expect(page.returnedCount()).toBe(1))
    expect(page.toReturnCount()).toBe(1)
    // The pair scanned out is listed as already scanned; the other one is
    // still waiting for its scan.
    await waitFor(() => expect(page.listedCodes()).toEqual([bravoCodes[0]]))
    await page.showPending()
    await waitFor(() => expect(page.listedCodes()).toEqual([bravoCodes[1]]))
  })

  it('asks before switching to another professional picked in the list', async () => {
    const page = await returnsProsPage()

    await page.pickPro('Bravo')
    expect(page.toReturnCount()).toBe(2)

    // Another professional is picked by mistake: the volunteer is asked,
    // says no, and stays on the open one.
    await page.pickPro('Alpha')
    let question = await page.question()
    expect(question.title).toBe(
      'Etes vous sur de vouloir changer de professionnel\u00a0?',
    )
    await question.decline()
    expect(page.selectedPro()).toBe('4 - Jean Bravo')
    expect(page.toReturnCount()).toBe(2)

    await page.pickPro('Alpha')
    question = await page.question()
    await question.confirm()
    expect(page.selectedPro()).toBe('3 - Ski Alpha')
    await waitFor(() => expect(page.toReturnCount()).toBe(1))
  })

  // Picking the open professional a second time, by a slip of the hand,
  // must not close their articles.
  it('keeps the professional open when picked again', async () => {
    const page = await returnsProsPage()
    await page.pickPro('Bravo')

    await page.pickPro('Bravo')

    expect(page.isQuestionOpen()).toBe(false)
    expect(page.selectedPro()).toBe('4 - Jean Bravo')
    expect(page.isScanOpen()).toBe(true)
  })

  // The volunteer scans a pair of skis BRAVO takes back. The
  // toast confirms it, the pair moves from « En attente de scan » to « Déjà
  // scannés », and the field is ready for the next scan.
  it('confirms a scan, moves the article to the scanned list and empties the field', async () => {
    const page = await returnsProsPage()
    await page.pickPro('Bravo')

    await page.scan(bravoCodes[1])

    await page.toast(`Retour de l'article ${bravoCodes[1]} effectué`)
    expect(page.scanInput()).toBe('')
    await waitFor(() => expect(page.returnedCount()).toBe(1))
    expect(page.toReturnCount()).toBe(1)
    await waitFor(() => expect(page.listedCodes()).toEqual([bravoCodes[1]]))
    await page.showPending()
    await waitFor(() => expect(page.listedCodes()).toEqual([bravoCodes[0]]))
  })

  // The scanned list is sorted by category, not by scan: the article just
  // scanned stands out for a few seconds, so the volunteer sees at a
  // glance which line it landed on.
  it('makes the article just scanned stand out for a few seconds', async () => {
    const page = await returnsProsPage()
    await page.pickPro('Bravo')
    expect(page.highlightedCodes()).toEqual([])

    await page.scan(bravoCodes[0])
    await page.scan(bravoCodes[1])
    await waitFor(() => expect(page.listedCodes()).toHaveLength(2))
    // Only the last one.
    expect(page.highlightedCodes()).toEqual([bravoCodes[1]])

    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(page.highlightedCodes()).toEqual([bravoCodes[1]])
    await waitFor(() => expect(page.highlightedCodes()).toEqual([]))
  })

  // A code that is not an article, or an article of
  // ALPHA scanned while BRAVO is open, is refused with an alert; the
  // field is emptied and nothing is returned.
  it.each([
    [
      'an unknown code',
      () => `${YEAR} 99Z`,
      (c: string) => `Article ${c} inconnu`,
    ],
    [
      "an article of another professional's deposit",
      () => alphaCode,
      (c: string) => `L'article ${c} n'appartient pas à ce dépôt`,
    ],
  ])('refuses %s', async (_label, scanned, message) => {
    const page = await returnsProsPage()
    await page.pickPro('Bravo')

    await page.scan(scanned())

    const alert = await page.alert()
    expect(alert.message).toBe(message(scanned()))
    await alert.dismiss()
    expect(page.scanInput()).toBe('')
    expect(page.returnedCount()).toBe(0)
    expect(page.toReturnCount()).toBe(2)
    expect(page.listedCodes()).toEqual([])
  })

  // The same pair goes through the scanner twice. The second
  // scan is refused, the pair is counted once.
  it('refuses an article already scanned out', async () => {
    const page = await returnsProsPage()
    await page.pickPro('Bravo')
    await page.scan(bravoCodes[0])
    await page.toast(`Retour de l'article ${bravoCodes[0]} effectué`)

    await page.scan(bravoCodes[0])

    const alert = await page.alert()
    expect(alert.message).toBe(
      `Retour de l'article ${bravoCodes[0]} déja effectué`,
    )
    await alert.dismiss()
    expect(page.scanInput()).toBe('')
    expect(page.returnedCount()).toBe(1)
    expect(page.toReturnCount()).toBe(1)
    expect(page.listedCodes()).toEqual([bravoCodes[0]])
  })

  // BERTRAND (fiche 5) has an article that is not on the shelf
  // to be handed back: sold to a buyer, struck off the fiche, or never
  // scanned in at the reception desk. The volunteer scans it anyway: the
  // scan is refused with an alert telling them to call an administrator,
  // the field is emptied and nothing is handed back.
  it.each<[string, Partial<Article>, (c: string) => string]>([
    [
      'sold',
      { status: 'SOLD', saleId: 'a-sale' },
      (c) =>
        `L'article ${c} est marqué comme vendu, contactez un administrateur`,
    ],
    [
      'struck off the fiche',
      { status: 'DELETED' },
      (c) =>
        `L'article ${c} est marqué comme supprimé, contactez un administrateur`,
    ],
    [
      'never received',
      { status: 'RECEPTION_PENDING' },
      (c) =>
        `L'article ${c} n'a pas été réceptionné, contactez un administrateur`,
    ],
    [
      'marked absent',
      { status: 'ABSENT' },
      (c) =>
        `L'article ${c} est marqué comme absent, contactez un administrateur`,
    ],
  ])('refuses the scan of an article %s', async (_label, article, message) => {
    const bertrand = await givenDeposit(
      {
        depositIndex: 5,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Bertrand', firstName: 'Paul' },
      },
      [article, {}],
    )
    const [code, unsoldCode] = bertrand.articles.map((a) => a.code)
    const page = await returnsProsPage()
    await page.pickPro('Bertrand')
    expect(page.toReturnCount()).toBe(1)

    await page.scan(code)

    const alert = await page.alert()
    expect(alert.title).toBe('Erreur')
    expect(alert.message).toBe(message(code))
    await alert.dismiss()
    expect(page.scanInput()).toBe('')
    expect(page.returnedCount()).toBe(0)
    expect(page.toReturnCount()).toBe(1)
    expect(page.listedCodes()).toEqual([])
    await page.showPending()
    await waitFor(() => expect(page.listedCodes()).toEqual([unsoldCode]))
  })

  // Sold: the pair BERTRAND sold to a buyer is scanned by mistake. The scan
  // is refused, and on the fiche the pair still reads « Vendu ».
  it('keeps a sold article sold when its scan is refused', async () => {
    const bertrand = await givenDeposit(
      {
        depositIndex: 5,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Bertrand', firstName: 'Paul' },
      },
      [{ status: 'SOLD', saleId: 'a-sale' }],
    )
    const before = await depositEditPage(bertrand.deposit.id)
    expect(before.articleBadge(0)).toBe('Vendu')
    const page = await returnsProsPage()
    await page.pickPro('Bertrand')

    await page.scan(bertrand.articles[0].code)
    const alert = await page.alert()
    await alert.dismiss()

    const fiche = await depositEditPage(bertrand.deposit.id)
    expect(fiche.articleBadge(0)).toBe('Vendu')
  })

  // The other computers learn that each pair was handed back.
  it('sends each return to the other computers', async () => {
    const page = await returnsProsPage()
    await page.pickPro('Bravo')

    await page.scan(bravoCodes[0])
    await page.toast(`Retour de l'article ${bravoCodes[0]} effectué`)
    await page.scan(bravoCodes[1])
    await page.toast(`Retour de l'article ${bravoCodes[1]} effectué`)

    const outbox = await local.outbox()
    const articles = await local.articles()
    const idOf = (code: string) => articles.find((a) => a.code === code)?.id
    expect(
      outbox.map((op) => [
        op.collection,
        op.operation,
        op.recordId,
        op.data.status,
      ]),
    ).toEqual([
      ['articles', 'update', idOf(bravoCodes[0]), 'RETURNED'],
      ['articles', 'update', idOf(bravoCodes[1]), 'RETURNED'],
    ])
  })
})
