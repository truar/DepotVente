import { beforeEach, describe, expect, it } from 'vitest'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { depositEditPage } from '@/test/pages/deposit-edit.page.ts'
import { proReceptionPage } from '@/test/pages/pro-reception.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

const boots = {
  category: 'Chaussures',
  brand: 'Nordica',
  discipline: 'Alpin',
  color: 'Noir',
  size: '27.5',
  price: '80',
}

// A professional's articles still to scan in, as the reception desk
// (/deposits/pros) lists them.
const code = (depositIndex: number, letter: string) =>
  `${YEAR} ${depositIndex}${letter}`

async function proReceptionOf(pro: string) {
  const reception = await proReceptionPage()
  await reception.pickPro(pro)
  return reception
}

// Played on the real screen: a volunteer opens "Modifier la fiche" from the
// deposits list to correct a deposit registered earlier (on this PC or on
// another one), changes what needs changing and saves.
describe('Screen: correct a registered deposit', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  // The seller came back to fix their phone number. Saving brings the
  // volunteer back to the list and queues, in write order, the seller, the
  // deposit, then every article of the fiche, touched or not.
  it('saves the fiche, goes back to the deposits list and queues the seller, the deposit and each article', async () => {
    const { contact, deposit, articles } = await givenDeposit({}, [{}, {}])
    const page = await depositEditPage(deposit.id)

    await page.save()
    await page.savedToast(12)

    await page.depositsListShown()
    const outbox = await local.outbox()
    expect(
      outbox.map((op) => [op.collection, op.operation, op.recordId]),
    ).toEqual([
      ['contacts', 'update', contact.id],
      ['deposits', 'update', deposit.id],
      ['articles', 'update', articles[0].id],
      ['articles', 'update', articles[1].id],
    ])
    expect(outbox[0].data).toMatchObject({
      lastName: 'Durand',
      firstName: 'Camille',
      phoneNumber: '0600000000',
      city: 'Grenoble',
    })
    expect(outbox[1].data).toMatchObject({
      contributionStatus: 'PAYE',
      contributionAmount: 2,
      contributionCollectWorkstationId: null,
    })
    // An article update carries the editable fields and the status, never
    // the code, the letter or the deposit it belongs to.
    expect(Object.keys(outbox[2].data).sort()).toEqual([
      'brand',
      'category',
      'color',
      'discipline',
      'model',
      'price',
      'size',
      'status',
      'updatedAt',
    ])
    expect(outbox[2].data).toMatchObject({
      status: 'RECEPTION_OK',
      price: 120,
      brand: 'Rossignol',
      category: 'Skis',
    })
  })

  // An article already registered cannot be taken off the
  // fiche: the bin strikes it (saved as DELETED) and a struck one can be
  // put back (saved as RECEPTION_OK).
  it('strikes and restores registered articles instead of removing them', async () => {
    const { deposit } = await givenDeposit({}, [{}, { status: 'DELETED' }, {}])
    const page = await depositEditPage(deposit.id)
    expect(page.articleCodes()).toEqual(['12 A', '12 B', '12 C'])
    expect(page.isArticleDeleted(1)).toBe(true)

    // Even the last line, never printed on this screen, stays on the fiche.
    await page.removeArticle(2)
    await page.removeArticle(0)
    await page.restoreArticle(1)

    expect(page.articleCodes()).toEqual(['12 A', '12 B', '12 C'])
    expect(page.isArticleDeleted(0)).toBe(true)
    expect(page.isArticleDeleted(1)).toBe(false)
    expect(page.isArticleDeleted(2)).toBe(true)
    expect(page.articleCount()).toBe(1)

    await page.save()
    await page.savedToast(12)

    // Reopened, the fiche shows what was saved.
    const reopened = await depositEditPage(deposit.id)
    expect(reopened.articleCodes()).toEqual(['12 A', '12 B', '12 C'])
    expect(reopened.isArticleDeleted(0)).toBe(true)
    expect(reopened.isArticleDeleted(1)).toBe(false)
    expect(reopened.isArticleDeleted(2)).toBe(true)
    expect(reopened.articleCount()).toBe(1)
  })

  // A sold or returned article is locked on the fiche (a
  // badge in place of its buttons) and saving the fiche leaves its status
  // alone.
  it('keeps sold and returned articles as they are', async () => {
    const { deposit } = await givenDeposit({}, [
      { status: 'SOLD' },
      { status: 'RETURNED' },
      {},
    ])
    const page = await depositEditPage(deposit.id)
    expect(page.articleBadge(0)).toBe('Vendu')
    expect(page.articleBadge(1)).toBe('Rendu')
    expect(page.articleBadge(2)).toBeNull()

    await page.save()
    await page.savedToast(12)

    const reopened = await depositEditPage(deposit.id)
    expect(reopened.articleBadge(0)).toBe('Vendu')
    expect(reopened.articleBadge(1)).toBe('Rendu')
    expect(reopened.articleBadge(2)).toBeNull()
    expect(reopened.isArticleDeleted(2)).toBe(false)
  })

  // A professional's articles stay pending until they are scanned
  // in at the reception desk. Correcting the fiche must not receive them.
  it('leaves untouched articles of a professional in their status', async () => {
    const { deposit } = await givenDeposit(
      {
        type: 'PRO',
        contributionStatus: 'PRO',
        contributionAmount: 0,
        seller: { lastName: 'Allo', firstName: 'Ski' },
      },
      [{ status: 'RECEPTION_PENDING' }, {}, { status: 'RECEPTION_PENDING' }],
    )
    const page = await depositEditPage(deposit.id)

    await page.save()
    await page.savedToast(12)

    // At the reception desk, A and C are still waiting to be scanned.
    const reception = await proReceptionOf('Allo')
    // The counts load after the professional is picked.
    await waitFor(() =>
      expect([reception.scannedCount(), reception.totalCount()]).toEqual([
        1, 3,
      ]),
    )
    await reception.showPending()
    await waitFor(() =>
      expect([...reception.listedCodes()].sort()).toEqual([
        code(12, 'A'),
        code(12, 'C'),
      ]),
    )
  })

  // An article forgotten at the deposit desk can be added to the fiche
  // afterwards: it takes the next letter, is saved received like the
  // others, counts in the contribution, and is sent to the server.
  it('saves an article added on this screen, received and counted in the contribution', async () => {
    const { deposit } = await givenDeposit(
      {},
      Array.from({ length: 10 }, () => ({})),
    )
    const page = await depositEditPage(deposit.id)
    expect(page.contributionAmount()).toBe(4)

    await page.addArticle()
    await page.fillArticle(10, boots)
    expect(page.articleCodes().at(-1)).toBe('12 K')
    expect(page.articleCount()).toBe(11)
    expect(page.contributionAmount()).toBe(6)

    await page.save()
    await page.savedToast(12)

    // The article goes to the other computers as a new one.
    const outbox = await local.outbox()
    expect(
      outbox
        .filter((op) => op.collection === 'articles')
        .map((op) => op.operation),
    ).toEqual([...Array.from({ length: 10 }, () => 'update'), 'create'])

    // Reopened, the fiche holds it, as an article like the others.
    const reopened = await depositEditPage(deposit.id)
    expect(reopened.articleCodes()).toHaveLength(11)
    expect(reopened.articleCodes().at(-1)).toBe('12 K')
    expect(reopened.article(10)).toMatchObject({
      category: 'Chaussures',
      brand: 'Nordica',
      discipline: 'Alpin',
      price: '80',
    })
    expect(reopened.isArticleDeleted(10)).toBe(false)
    expect(reopened.articleBadge(10)).toBeNull()
    expect(reopened.articleCount()).toBe(11)
    expect(reopened.contributionAmount()).toBe(6)
  })

  // On a professional's fiche too: the article is added at the desk, in
  // front of the volunteer, so it is received there and then.
  it('saves an article added to a professional fiche as received', async () => {
    const { deposit } = await givenDeposit(
      {
        type: 'PRO',
        contributionStatus: 'PRO',
        contributionAmount: 0,
        seller: { lastName: 'Allo', firstName: 'Ski' },
      },
      [{ status: 'RECEPTION_PENDING' }],
    )
    const page = await depositEditPage(deposit.id)

    await page.addArticle()
    await page.fillArticle(1, boots)
    await page.save()
    await page.savedToast(12)

    // At the reception desk, B counts as scanned; only A is still awaited.
    const reception = await proReceptionOf('Allo')
    // The counts load after the professional is picked.
    await waitFor(() =>
      expect([reception.scannedCount(), reception.totalCount()]).toEqual([
        1, 2,
      ]),
    )
    await reception.showPending()
    await waitFor(() =>
      expect(reception.listedCodes()).toEqual([code(12, 'A')]),
    )
  })
})
