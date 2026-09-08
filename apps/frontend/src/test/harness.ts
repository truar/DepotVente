// Common infrastructure for application tests: drive the app the way a
// screen does (through its hooks, against the local base), then look at what
// the operator would see locally and at what the server would receive.
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import { v4 as uuid } from 'uuid'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import type { Predeposit, PredepositArticle } from '@/db.ts'
import { db } from '@/db.ts'
import { useCreateDepot } from '@/hooks/useCreateDepot.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { loadDepositFormFromPredeposit } from '@/services/deposit-from-predeposit.ts'
import { compareOutboxOrder } from '@/services/sync-service.ts'
import {
  generateArticleCode,
  generateIdentificationLetter,
  getYear,
  shortArticleCode,
} from '@/utils'

// ---------------------------------------------------------------------------
// Given: the computer's settings
// ---------------------------------------------------------------------------

export async function givenWorkstation(incrementStart: number) {
  await db.workstation.put({ key: 'incrementStart', value: incrementStart })
}

// A predeposit already in the local base (they come from the server, filled
// in by the sellers before the day), with one article per entry of
// `articles`, lettered A, B, C... in order.
export async function givenPredeposit(
  overrides: Partial<Predeposit> = {},
  articles: Array<Partial<PredepositArticle>> = [{}],
): Promise<Predeposit> {
  const now = new Date()
  const predeposit: Predeposit = {
    id: uuid(),
    predepositIndex: 7,
    sellerLastName: 'Martin',
    sellerFirstName: 'Lucie',
    sellerPhoneNumber: '0611111111',
    sellerCity: 'Chambéry',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  }
  await db.predeposits.add(predeposit)
  await db.predepositArticles.bulkAdd(
    articles.map((article, index) => ({
      id: uuid(),
      predepositId: predeposit.id,
      price: 150,
      category: 'Skis',
      discipline: 'Alpin',
      brand: 'Salomon',
      model: 'S/Max',
      size: '165',
      color: 'bleu',
      year: YEAR - 2,
      identificationLetter: generateIdentificationLetter(index),
      articleIndex: index,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      ...article,
    })),
  )
  return predeposit
}

// ---------------------------------------------------------------------------
// When: run a hook as a screen would
// ---------------------------------------------------------------------------

// Renders the hook and waits for the workstation settings to be loaded (they
// come from a live query, so the first render sees the default). The value
// returned is the one a screen would call after that.
export async function runHook<T>(hook: () => T): Promise<T> {
  const expected = (await db.workstation.get('incrementStart'))?.value ?? 0
  const { result } = renderHook(() => ({
    workstation: useWorkstation()[0],
    value: hook(),
  }))
  await waitFor(() =>
    expect(result.current.workstation.incrementStart).toBe(expected),
  )
  return result.current.value
}

type ContributionStatus = NonNullable<
  DepositFormType['deposit']['contributionStatus']
>

export const app = {
  async createDeposit(form: DepositFormType['deposit']) {
    const { mutate } = await runHook(useCreateDepot)
    await mutate(form)
  },

  // The predeposit screen: "Valider" fills the form from the predeposit, the
  // operator picks the contribution status, then saves. Returns the form as
  // it was filled, for assertions on what the operator saw.
  async createDepositFromPredeposit(
    predepositId: string,
    {
      depositIndex,
      contributionStatus = 'PAYE',
    }: { depositIndex: number; contributionStatus?: ContributionStatus },
  ) {
    const form = await loadDepositFormFromPredeposit(predepositId, depositIndex)
    if (!form)
      throw new Error(`No predeposit ${predepositId} in the local base`)
    await app.createDeposit({ ...form, contributionStatus })
    return form
  },
}

// ---------------------------------------------------------------------------
// Then: what is on this computer, and what is queued for the server
// ---------------------------------------------------------------------------

export const local = {
  contacts: () => db.contacts.toArray(),
  deposits: () => db.deposits.toArray(),
  articles: () => db.articles.toArray(),
  predeposits: () => db.predeposits.toArray(),
  // In the order the sync service will push them.
  outbox: async () => (await db.outbox.toArray()).sort(compareOutboxOrder),
}

// ---------------------------------------------------------------------------
// Builders: valid form input with sensible defaults, override what matters
// ---------------------------------------------------------------------------

type DepositForm = DepositFormType['deposit']
type ArticleForm = DepositForm['articles'][number]

export const YEAR = getYear()
const DEFAULT_DEPOSIT_INDEX = 12

export function aSkiArticle(overrides: Partial<ArticleForm> = {}): ArticleForm {
  const depotIndex = overrides.depotIndex ?? DEFAULT_DEPOSIT_INDEX
  const identificationLetter = overrides.identificationLetter ?? 'A'
  return {
    price: 120,
    discipline: 'Alpin',
    brand: 'Rossignol',
    type: 'Skis',
    size: '170',
    color: 'rouge',
    model: 'Hero',
    year: YEAR - 3,
    articleIndex: 0,
    depotIndex,
    identificationLetter,
    articleCode: generateArticleCode(YEAR, depotIndex, identificationLetter),
    shortArticleCode: shortArticleCode(depotIndex, identificationLetter),
    ...overrides,
  }
}

export function aDepositForm(
  overrides: Partial<DepositForm> = {},
): DepositForm {
  const depotIndex = overrides.depotIndex ?? DEFAULT_DEPOSIT_INDEX
  return {
    depotIndex,
    lastName: 'Durand',
    firstName: 'Camille',
    phoneNumber: '0600000000',
    city: 'Grenoble',
    contributionStatus: 'PAYE',
    contributionAmount: 2,
    articles: [aSkiArticle({ depotIndex })],
    ...overrides,
  }
}
