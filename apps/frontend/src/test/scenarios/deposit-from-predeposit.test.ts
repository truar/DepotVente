import { beforeEach, describe, expect, it } from 'vitest'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import {
  YEAR,
  app,
  givenPredeposit,
  givenWorkstation,
  local,
} from '@/test/harness.ts'

// A seller filled in a predeposit at home: a pair of skis and a pair of
// boots. On the day, the operator on cash register 3 picks it in the
// combobox, validates, chooses "à payer", and saves it as deposit n°12.
describe('Deposit created from a predeposit', () => {
  let predepositId: string
  let form: DepositFormType['deposit']

  beforeEach(async () => {
    await givenWorkstation(3)
    predepositId = (
      await givenPredeposit({}, [
        {},
        {
          category: 'Chaussures',
          brand: 'Nordica',
          model: 'Speedmachine',
          size: '27.5',
          price: 80,
        },
      ])
    ).id
    form = await app.createDepositFromPredeposit(predepositId, {
      depositIndex: 12,
      contributionStatus: 'A_PAYER',
    })
  })

  it('fills the form with the seller and the articles, under the new deposit number', () => {
    expect(form).toMatchObject({
      predepositId,
      depotIndex: 12,
      lastName: 'Martin',
      firstName: 'Lucie',
      phoneNumber: '0611111111',
      city: 'Chambéry',
      contributionAmount: 2,
    })
    expect(
      form.articles.map((a) => [
        a.type,
        a.brand,
        a.articleCode,
        a.shortArticleCode,
      ]),
    ).toEqual([
      ['Skis', 'Salomon', `${YEAR} 12A`, '12 A'],
      ['Chaussures', 'Nordica', `${YEAR} 12B`, '12 B'],
    ])
  })

  it('records the seller as a contact and the deposit against it', async () => {
    const [contact] = await local.contacts()
    const [deposit] = await local.deposits()

    expect(contact).toMatchObject({
      lastName: 'Martin',
      firstName: 'Lucie',
      phoneNumber: '0611111111',
      city: 'Chambéry',
    })
    expect(deposit).toMatchObject({
      sellerId: contact.id,
      type: 'PARTICULIER',
      depositIndex: 12,
      incrementStart: 3,
      contributionStatus: 'A_PAYER',
      contributionAmount: 2,
    })
  })

  it('records both articles as received, with the predeposit details and fresh codes', async () => {
    const [deposit] = await local.deposits()
    const articles = (await local.articles()).sort((a, b) =>
      a.identificationLetter.localeCompare(b.identificationLetter),
    )

    expect(articles).toHaveLength(2)
    expect(articles[0]).toMatchObject({
      depositId: deposit.id,
      code: `${YEAR} 12A`,
      category: 'Skis',
      brand: 'Salomon',
      model: 'S/Max',
      size: '165',
      price: 150,
      status: 'RECEPTION_OK',
    })
    expect(articles[1]).toMatchObject({
      depositId: deposit.id,
      code: `${YEAR} 12B`,
      category: 'Chaussures',
      brand: 'Nordica',
      model: 'Speedmachine',
      size: '27.5',
      price: 80,
      status: 'RECEPTION_OK',
    })
  })

  it('links the predeposit to the deposit so it leaves the combobox', async () => {
    const [deposit] = await local.deposits()
    const [predeposit] = await local.predeposits()

    expect(predeposit.id).toBe(predepositId)
    expect(predeposit.depositId).toBe(deposit.id)
  })

  it('queues contact, deposit, articles, then the predeposit link for the server', async () => {
    const outbox = await local.outbox()

    expect(outbox.map((op) => [op.collection, op.operation])).toEqual([
      ['contacts', 'create'],
      ['deposits', 'create'],
      ['articles', 'create'],
      ['articles', 'create'],
      ['predeposits', 'update'],
    ])
    const [deposit] = await local.deposits()
    expect(outbox[4]).toMatchObject({
      recordId: predepositId,
      data: { depositId: deposit.id },
    })
  })
})

// A seller with more than 26 articles: after Z the letters go on AA, AB...
// They must come after Z, not between A and B as a plain text sort would
// put them, and the barcode follows the same letter.
describe('Deposit created from a predeposit of 27 articles', () => {
  it('letters the 27th article AA, after Z, in its short code and its barcode', async () => {
    await givenWorkstation(3)
    const { id } = await givenPredeposit(
      {},
      Array.from({ length: 27 }, () => ({})),
    )

    const form = await app.createDepositFromPredeposit(id, {
      depositIndex: 12,
    })

    expect(
      form.articles
        .slice(-2)
        .map((a) => [
          a.identificationLetter,
          a.shortArticleCode,
          a.articleCode,
        ]),
    ).toEqual([
      ['Z', '12 Z', `${YEAR} 12Z`],
      ['AA', '12 AA', `${YEAR} 12AA`],
    ])
    expect(form.contributionAmount).toBe(6)
    const saved = await local.articles()
    expect(saved).toHaveLength(27)
    expect(saved.find((a) => a.identificationLetter === 'AA')).toMatchObject({
      code: `${YEAR} 12AA`,
    })
  })
})

// Current behaviour, pinned until it is decided, not because it is right.
// A predeposit's letters come from the predeposit itself (the
// imported file), while the barcode is rebuilt from the article's position
// in the list. When the letters skip one (A then C: the B row is missing
// from the local base), the label reads "12 C" while the barcode says 12B,
// and that is what is saved.
describe('Deposit created from a predeposit whose letters skip one', () => {
  it('keeps the predeposit letter but builds the barcode from the position (current behaviour)', async () => {
    await givenWorkstation(3)
    const { id } = await givenPredeposit({}, [
      {},
      {
        category: 'Chaussures',
        brand: 'Nordica',
        identificationLetter: 'C',
        articleIndex: 2,
      },
    ])

    const form = await app.createDepositFromPredeposit(id, {
      depositIndex: 12,
    })

    expect(
      form.articles.map((a) => [
        a.brand,
        a.identificationLetter,
        a.shortArticleCode,
        a.articleCode,
      ]),
    ).toEqual([
      ['Salomon', 'A', '12 A', `${YEAR} 12A`],
      ['Nordica', 'C', '12 C', `${YEAR} 12B`],
    ])
    const saved = (await local.articles()).sort((a, b) =>
      a.brand.localeCompare(b.brand),
    )
    expect(saved.map((a) => [a.brand, a.identificationLetter, a.code])).toEqual(
      [
        ['Nordica', 'C', `${YEAR} 12B`],
        ['Salomon', 'A', `${YEAR} 12A`],
      ],
    )
  })
})
