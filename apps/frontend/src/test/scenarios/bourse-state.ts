// The final state of a bourse, described in a few lines and built straight
// into the local base, for the variants of the test book (« Bilan —
// scénarios »). Each variant starts from the reference bourse, changes one
// thing, and checks what that does to the balance.
//
// The state is built the way the day leaves it: fiches and their articles,
// sales (articles marked sold), refunds (articles back on the shelf), the
// tills' counts. Then the returns are worked out by the app's own
// computation, and the cheques written by the app's own mutation: those are
// the steps whose rules the balance depends on. The screens are covered by
// the reference bourse typed through them (reference-bourse.ts) and by
// their own tests.
import type { CashRegisterControl, Deposit } from '@/db.ts'
import { db } from '@/db.ts'
import { loadBilanPdfData } from '@/pdf/load-bilan-pdf-data.ts'
import { useReturnDepositMutation } from '@/hooks/useReturnDepositMutation.ts'
import { plain } from '@/test/amounts.ts'
import {
  app,
  givenCashRegisterControl,
  givenDeposit,
  givenPredeposit,
  givenRefund,
  givenSale,
  givenWorkstation,
  runHook,
} from '@/test/harness.ts'

// An article by its price; « pending » for a pro article never received,
// « deleted » for one taken off.
type ArticleSpec =
  | number
  | { price: number; status: 'RECEPTION_PENDING' | 'DELETED' }

type FicheSpec = {
  seller: string // « Durand Camille »
  type: Deposit['type']
  depositIndex: number
  till: number
  contribution: Deposit['contributionStatus']
  contributionAmount: number
  fromPredeposit?: boolean
  articles: Array<ArticleSpec>
}

// An article of a fiche: its key and its letter, ['durand', 'A'].
type ArticleRef = [string, string]

type SaleSpec = {
  saleIndex: number
  till: number
  buyer: string // « Leroy Alice », or « CMR Club »
  articles: Array<ArticleRef>
  pay: { cash?: number; card?: number; check?: number; deferred?: number }
}

// Money handed back at a till, the articles coming back to the shelf.
type RefundSpec = {
  saleIndex: number
  till: number
  card?: number
  cash?: number
  articles: Array<ArticleRef>
}

type CountSpec = {
  till: number
  type: CashRegisterControl['type']
  real: number // counted, float taken off
  difference?: number // counted minus expected
}

export type BourseSpec = {
  fiches: Record<string, FicheSpec>
  sales: Array<SaleSpec>
  refunds: Array<RefundSpec>
  counts: Array<CountSpec>
  // Fiches whose contribution is settled in the evening, at till 7000.
  settled: Array<string>
  // Fiches whose seller comes for the cheque, at till 7000.
  cheques: Array<string>
}

// The reference bourse of the test book, as the day leaves it. A fresh copy
// each time, for a variant to change.
export function referenceBourse(): BourseSpec {
  return {
    fiches: {
      durand: {
        seller: 'Durand Camille',
        type: 'PARTICULIER',
        depositIndex: 1001,
        till: 1000,
        contribution: 'PAYE',
        contributionAmount: 2,
        fromPredeposit: true,
        articles: [100, 40, 10],
      },
      martin: {
        seller: 'Martin Lucie',
        type: 'PARTICULIER',
        depositIndex: 1002,
        till: 1000,
        contribution: 'A_PAYER',
        contributionAmount: 2,
        articles: [150, 30],
      },
      bon: {
        seller: 'Bon Jean',
        type: 'PARTICULIER',
        depositIndex: 2001,
        till: 2000,
        contribution: 'GRATUIT',
        contributionAmount: 0,
        articles: [20, 10],
      },
      sport: {
        seller: 'Sport Pro',
        type: 'PRO',
        depositIndex: 3,
        till: 1,
        contribution: 'PRO',
        contributionAmount: 0,
        articles: [200, 300],
      },
    },
    sales: [
      {
        saleIndex: 5001,
        till: 5000,
        buyer: 'Leroy Alice',
        articles: [
          ['durand', 'A'],
          ['durand', 'B'],
        ],
        pay: { cash: 140 },
      },
      {
        saleIndex: 5002,
        till: 5000,
        buyer: 'Petit Bruno',
        articles: [['martin', 'A']],
        pay: { card: 150 },
      },
      {
        saleIndex: 6001,
        till: 6000,
        buyer: 'Roux Chloé',
        articles: [
          ['sport', 'A'],
          ['martin', 'B'],
        ],
        pay: { check: 200, cash: 30 },
      },
    ],
    refunds: [],
    counts: [
      { till: 5000, type: 'SALE', real: 140 },
      { till: 6000, type: 'SALE', real: 30 },
      { till: 1000, type: 'DEPOSIT', real: 2 },
      { till: 2000, type: 'DEPOSIT', real: 0 },
      { till: 7000, type: 'RETURN', real: 0 },
    ],
    settled: [],
    cheques: ['durand', 'martin'],
  }
}

const letterIndex = (letter: string) => letter.charCodeAt(0) - 65

const person = (name: string) => {
  const [lastName, firstName] = name.split(' ')
  return { lastName, firstName }
}

export async function givenTheBourse(spec: BourseSpec) {
  // ---- the fiches ----
  const fiches: Record<
    string,
    { deposit: Deposit; articleIds: Array<string> }
  > = {}
  for (const [key, fiche] of Object.entries(spec.fiches)) {
    const { deposit, articles } = await givenDeposit(
      {
        type: fiche.type,
        depositIndex: fiche.depositIndex,
        incrementStart: fiche.till,
        dropWorkstationId: fiche.till,
        contributionStatus: fiche.contribution,
        contributionAmount: fiche.contributionAmount,
        seller: person(fiche.seller),
      },
      fiche.articles.map((article) =>
        typeof article === 'number'
          ? { price: article }
          : { price: article.price, status: article.status },
      ),
    )
    if (fiche.fromPredeposit) {
      const { lastName, firstName } = person(fiche.seller)
      await givenPredeposit({
        sellerLastName: lastName,
        sellerFirstName: firstName,
        depositId: deposit.id,
      })
    }
    fiches[key] = { deposit, articleIds: articles.map((a) => a.id) }
  }
  const articleId = ([key, letter]: ArticleRef) =>
    fiches[key].articleIds[letterIndex(letter)]

  // ---- the sales and the refunds ----
  const sales = new Map<number, Awaited<ReturnType<typeof givenSale>>['sale']>()
  for (const sale of spec.sales) {
    const refunded = spec.refunds
      .filter((refund) => refund.saleIndex === sale.saleIndex)
      .reduce((a, r) => a + (r.card ?? 0) + (r.cash ?? 0), 0)
    const { sale: saved } = await givenSale({
      saleIndex: sale.saleIndex,
      incrementStart: sale.till,
      cashAmount: sale.pay.cash ?? 0,
      cardAmount: sale.pay.card ?? 0,
      checkAmount: sale.pay.check ?? 0,
      deferredAmount: sale.pay.deferred ?? 0,
      totalRefundAmount: refunded,
      buyer: person(sale.buyer),
    })
    for (const ref of sale.articles) {
      await db.articles.update(articleId(ref), {
        saleId: saved.id,
        status: 'SOLD',
      })
    }
    sales.set(sale.saleIndex, saved)
  }
  for (const refund of spec.refunds) {
    await givenRefund(sales.get(refund.saleIndex)!, {
      incrementStart: refund.till,
      cardAmount: refund.card ?? 0,
      cashAmount: refund.cash ?? 0,
    })
    for (const ref of refund.articles) {
      await db.articles.update(articleId(ref), {
        saleId: null,
        status: 'RECEPTION_OK',
      })
    }
  }

  // ---- the tills' counts ----
  for (const count of spec.counts) {
    const difference = count.difference ?? 0
    await givenCashRegisterControl({
      cashRegisterId: count.till,
      type: count.type,
      realCashAmount: count.real,
      theoreticalCashAmount: count.real - difference,
      difference,
      totalAmount: count.real + 80,
    })
  }

  // ---- the evening, at the return till ----
  await givenWorkstation(7000)
  for (const { deposit } of Object.values(fiches)) {
    await app.computeReturn(deposit.id)
  }
  for (const key of spec.settled) {
    await db.deposits.update(fiches[key].deposit.id, {
      contributionStatus: 'SOLDE',
      contributionCollectWorkstationId: 7000,
    })
  }
  let checkId = 1001
  for (const key of spec.cheques) {
    const { mutate } = await runHook(useReturnDepositMutation)
    await mutate({
      depositId: fiches[key].deposit.id,
      signatory: spec.fiches[key].seller,
      checkId: checkId++,
      workstation: 7000,
    })
  }
}

// Every line of the balance, as the « Audit des calculs » shows it.
export async function balanceLines(): Promise<Record<string, string>> {
  const { audit } = await loadBilanPdfData()
  const lines: Record<string, string> = {}
  for (const group of audit) {
    for (const entry of group.entries) lines[entry.label] = plain(entry.value)
  }
  return lines
}
