// Common infrastructure for application tests: drive the app the way a
// screen does (through its hooks, against the local base), then look at what
// the operator would see locally and at what the server would receive.
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import { v4 as uuid } from 'uuid'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import type {
  Article,
  CashRegisterControl,
  Contact,
  Deposit,
  Predeposit,
  PredepositArticle,
} from '@/db.ts'
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

// A deposit already registered (on another PC, typically), with its seller
// and one article per entry of `articles`, lettered A, B, C... Articles are
// received and for sale unless an entry says otherwise. Codes follow the
// label: "<year> <depositIndex><letter>".
export async function givenDeposit(
  overrides: Partial<Deposit> & { seller?: Partial<Contact> } = {},
  articles: Array<Partial<Article>> = [{}],
): Promise<{ contact: Contact; deposit: Deposit; articles: Array<Article> }> {
  const now = new Date()
  const { seller, ...depositOverrides } = overrides
  const contact: Contact = {
    id: uuid(),
    lastName: 'Durand',
    firstName: 'Camille',
    phoneNumber: '0600000000',
    city: 'Grenoble',
    postalCode: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...seller,
  }
  const deposit: Deposit = {
    id: uuid(),
    type: 'PARTICULIER',
    sellerId: contact.id,
    contributionStatus: 'PAYE',
    contributionAmount: 2,
    depositIndex: 12,
    incrementStart: 1,
    dropWorkstationId: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...depositOverrides,
  }
  const rows: Array<Article> = articles.map((article, index) => {
    const identificationLetter = generateIdentificationLetter(index)
    return {
      id: uuid(),
      depositId: deposit.id,
      saleId: null,
      status: 'RECEPTION_OK',
      code: generateArticleCode(
        YEAR,
        deposit.depositIndex,
        identificationLetter,
      ),
      price: 120,
      category: 'Skis',
      discipline: 'Alpin',
      brand: 'Rossignol',
      model: 'Hero',
      serialNumber: null,
      size: '170',
      color: 'rouge',
      year: YEAR - 3,
      depositIndex: deposit.depositIndex,
      identificationLetter,
      articleIndex: index,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      ...article,
    }
  })
  await db.contacts.add(contact)
  await db.deposits.add(deposit)
  await db.articles.bulkAdd(rows)
  return { contact, deposit, articles: rows }
}

// A cash count already saved for a register: the evening's first pass,
// reopened for a correction. Counts and amounts default to an empty drawer
// with the 80 € float.
export async function givenCashRegisterControl(
  overrides: Partial<CashRegisterControl> = {},
): Promise<CashRegisterControl> {
  const now = new Date()
  const control: CashRegisterControl = {
    id: uuid(),
    cashRegisterId: 1000,
    type: 'DEPOSIT',
    initialAmount: 80,
    theoreticalCashAmount: 0,
    realCashAmount: 0,
    difference: 0,
    totalAmount: 0,
    cash200: 0,
    cash100: 0,
    cash50: 0,
    cash20: 0,
    cash10: 0,
    cash5: 0,
    cash2: 0,
    cash1: 0,
    cash05: 0,
    cash02: 0,
    cash01: 0,
    cash005: 0,
    cash002: 0,
    cash001: 0,
    comment: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  }
  await db.cashRegisterControls.add(control)
  return control
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
  sales: () => db.sales.toArray(),
  cashRegisterControls: () => db.cashRegisterControls.toArray(),
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
