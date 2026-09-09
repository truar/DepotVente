import { describe, expect, it } from 'vitest'
import type { Article, Deposit } from '@/db.ts'
import { db } from '@/db.ts'
import { app, givenDeposit, local } from '@/test/harness.ts'

// Articles of a deposit, sold or left on the shelf.
const sold = (price: number): Partial<Article> => ({
  price,
  saleId: 'a-sale',
  status: 'SOLD',
})
const unsold = (price: number): Partial<Article> => ({ price })

async function depositOf(
  overrides: Partial<Deposit>,
  articles: Array<Partial<Article>>,
) {
  const { deposit } = await givenDeposit(overrides, articles)
  return deposit.id
}

const returned = async (id: string) =>
  (await local.deposits()).find((deposit) => deposit.id === id)!

// The club keeps a share of what a seller sold, and hands back the rest. The
// share is 10% for a private seller, 15% for a professional. A contribution
// still owed is taken out of the seller's share when it covers it.
describe('Computing what a seller is owed', () => {
  describe('a private seller who sold 200 €', () => {
    // The club keeps 20 €, the seller is owed 180 € before any contribution.
    const articles = [sold(120), sold(80)]

    it.each([
      ['PAYE', 'PAYE', 0, 180],
      ['GRATUIT', 'GRATUIT', 0, 180],
      ['SOLDE', 'SOLDE', 0, 180],
    ] as const)(
      'leaves a %s contribution alone: the seller gets %s',
      async (status, expectedStatus, dueContribution, sellerAmount) => {
        const id = await depositOf(
          { contributionStatus: status, contributionAmount: 2 },
          articles,
        )

        await app.computeReturn(id)

        expect(await returned(id)).toMatchObject({
          soldAmount: 200,
          clubAmount: 20,
          dueContributionAmount: dueContribution,
          sellerAmount,
          contributionStatus: expectedStatus,
        })
      },
    )

    it.each(['A_PAYER', 'DEDUITE'] as const)(
      'takes an unpaid contribution (%s) out of the seller share',
      async (status) => {
        const id = await depositOf(
          { contributionStatus: status, contributionAmount: 2 },
          articles,
        )

        await app.computeReturn(id)

        expect(await returned(id)).toMatchObject({
          soldAmount: 200,
          clubAmount: 20,
          dueContributionAmount: 2,
          sellerAmount: 178,
          contributionStatus: 'DEDUITE',
        })
      },
    )

    it('dates the calculation', async () => {
      const id = await depositOf({ contributionStatus: 'PAYE' }, articles)

      await app.computeReturn(id)

      expect((await returned(id)).returnedCalculationDate).toBeInstanceOf(Date)
    })
  })

  describe('a professional who sold 200 €', () => {
    it('keeps 15% for the club and never deducts a contribution', async () => {
      const id = await depositOf(
        {
          type: 'PRO',
          contributionStatus: 'PRO',
          contributionAmount: 0,
        },
        [sold(120), sold(80)],
      )

      await app.computeReturn(id)

      expect(await returned(id)).toMatchObject({
        soldAmount: 200,
        clubAmount: 30,
        dueContributionAmount: 0,
        sellerAmount: 170,
        contributionStatus: 'PRO',
      })
    })
  })

  // The listing lets a volunteer run the calculation again, on one deposit
  // or on a whole selection. Running it twice must not take the
  // contribution twice, nor change what the seller is owed.
  describe('running the calculation again', () => {
    it.each([
      [
        'a private seller whose contribution is deducted',
        'PARTICULIER',
        'A_PAYER',
        178,
      ],
      ['a professional', 'PRO', 'PRO', 170],
    ] as const)(
      'gives %s the same amount every time',
      async (_label, type, status, sellerAmount) => {
        const id = await depositOf(
          { type, contributionStatus: status, contributionAmount: 2 },
          [sold(120), sold(80)],
        )

        const amounts = []
        for (let run = 0; run < 3; run++) {
          await app.computeReturn(id)
          const deposit = await returned(id)
          amounts.push([
            deposit.soldAmount,
            deposit.clubAmount,
            deposit.dueContributionAmount,
            deposit.sellerAmount,
            deposit.contributionStatus,
          ])
        }

        expect(amounts[1]).toEqual(amounts[0])
        expect(amounts[2]).toEqual(amounts[0])
        expect(amounts[0][3]).toBe(sellerAmount)
      },
    )
  })

  describe('what counts as sold', () => {
    it('adds up the sold articles only', async () => {
      const id = await depositOf({ contributionStatus: 'PAYE' }, [
        sold(120),
        unsold(80),
        { price: 50, status: 'RETURNED' },
        { price: 40, status: 'DELETED' },
      ])

      await app.computeReturn(id)

      expect(await returned(id)).toMatchObject({
        soldAmount: 120,
        clubAmount: 12,
        sellerAmount: 108,
      })
    })

    it('owes nothing on a deposit that sold nothing, and still owes the contribution', async () => {
      const id = await depositOf(
        { contributionStatus: 'A_PAYER', contributionAmount: 2 },
        [unsold(120)],
      )

      await app.computeReturn(id)

      expect(await returned(id)).toMatchObject({
        soldAmount: 0,
        clubAmount: 0,
        dueContributionAmount: 0,
        sellerAmount: 0,
        contributionStatus: 'A_PAYER',
      })
    })
  })

  // The contribution is only taken when the seller's share covers it;
  // otherwise the seller still owes it and leaves with the whole share.
  describe('a contribution larger than the seller share', () => {
    it('is not deducted, and the deposit stays to be paid', async () => {
      const id = await depositOf(
        { contributionStatus: 'A_PAYER', contributionAmount: 20 },
        [sold(10)],
      )

      await app.computeReturn(id)

      expect(await returned(id)).toMatchObject({
        soldAmount: 10,
        clubAmount: 1,
        dueContributionAmount: 0,
        sellerAmount: 9,
        contributionStatus: 'A_PAYER',
      })
    })

    // A sale cancelled after the first calculation: the deducted
    // contribution has to go back to being owed.
    it('goes back to being owed when a sale is undone', async () => {
      const { deposit, articles } = await givenDeposit(
        { contributionStatus: 'A_PAYER', contributionAmount: 20 },
        [sold(200), sold(10)],
      )
      await app.computeReturn(deposit.id)
      expect(await returned(deposit.id)).toMatchObject({
        soldAmount: 210,
        dueContributionAmount: 20,
        sellerAmount: 169,
        contributionStatus: 'DEDUITE',
      })

      // The 200 € sale is cancelled: the article goes back on the shelf,
      // and what is left no longer covers the contribution.
      await putBackOnShelf(articles[0].id)
      await app.computeReturn(deposit.id)

      expect(await returned(deposit.id)).toMatchObject({
        soldAmount: 10,
        clubAmount: 1,
        dueContributionAmount: 0,
        sellerAmount: 9,
        contributionStatus: 'A_PAYER',
      })
    })
  })

  // Current behaviour, pinned: the amounts are stored as computed, without
  // rounding to the cent. 15% of 85,50 € is 12,825 €, so the club's share
  // and the seller's carry a half cent. The cheque itself is fine, it is
  // printed rounded (72,68 €), but the books add up stored values.
  describe('amounts with a half cent', () => {
    it('stores them unrounded', async () => {
      const id = await depositOf(
        { type: 'PRO', contributionStatus: 'PRO', contributionAmount: 0 },
        [sold(85.5)],
      )

      await app.computeReturn(id)

      expect(await returned(id)).toMatchObject({
        soldAmount: 85.5,
        clubAmount: 12.825,
        sellerAmount: 72.675,
      })
    })
  })
})

// A sale cancelled at the till: the article is for sale again.
async function putBackOnShelf(articleId: string) {
  await db.articles.update(articleId, { saleId: null, status: 'RECEPTION_OK' })
}
