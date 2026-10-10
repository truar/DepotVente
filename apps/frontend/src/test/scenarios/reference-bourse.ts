// The reference bourse of the test book (« Bilan — scénarios »): a whole
// small bourse, typed through the screens as on the day, small enough for
// every line of the balance to be worked out by hand.
//
//   Deposit   tills 1000 and 2000: Durand (from a predeposit, paid), Martin
//             (to pay), Bon (free); Sport Pro (imported, then received).
//   Sale      tills 5000 and 6000: Alice 140 € cash, Bruno 150 € card,
//             Chloé 200 € cheque + 30 € cash.
//   Return    till 7000: returns computed, Durand's and Martin's cheques
//             written.
//   Close     every till counted right.
//
// Each step is its own function, so a variant can replay the bourse and
// change one thing.
import { expect } from 'vitest'
import type { Denomination } from '@/test/pages/cash-count.ts'
import {
  YEAR,
  givenDeposit,
  givenPredeposit,
  givenWorkstation,
} from '@/test/harness.ts'
import { cashRegisterControlPage } from '@/test/pages/cash-register-control.page.ts'
import { depositAddPage } from '@/test/pages/deposit-add.page.ts'
import { proReceptionPage } from '@/test/pages/pro-reception.page.ts'
import { returnsCashCountPage } from '@/test/pages/returns-cash-register-control.page.ts'
import { returnsIndividualsPage } from '@/test/pages/returns-individuals.page.ts'
import { returnsListingPage } from '@/test/pages/returns-listing.page.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { salesControlPage } from '@/test/pages/sales-control.page.ts'
import { waitFor } from '@/test/screen.tsx'

// The label code of an article: « 2026 1001A ».
export const code = (depositIndex: number, letter: string) =>
  `${YEAR} ${depositIndex}${letter}`

const article = (category: string, discipline: string, price: number) => ({
  category,
  brand: 'Rossignol',
  discipline,
  color: 'Rouge',
  size: '170',
  model: 'Test',
  price: String(price),
})

// ---- before the day: what comes from the server ---------------------------

// Durand filled a predeposit in; Sport Pro's articles came with the import,
// waiting to be received.
export async function givenWhatCameBeforeTheDay() {
  await givenPredeposit(
    {
      sellerLastName: 'Durand',
      sellerFirstName: 'Camille',
      sellerPhoneNumber: '0600000001',
      sellerCity: 'Rumilly',
    },
    [
      { category: 'Skis', discipline: 'Alpin', price: 100 },
      { category: 'Chaussures', discipline: 'Alpin', price: 40 },
      { category: 'Bâtons', discipline: 'Alpin', price: 10 },
    ],
  )
  await givenDeposit(
    {
      type: 'PRO',
      contributionStatus: 'PRO',
      contributionAmount: 0,
      depositIndex: 3,
      incrementStart: 1,
      seller: { lastName: 'Sport', firstName: 'Pro' },
    },
    [
      { category: 'Skis', price: 200, status: 'RECEPTION_PENDING' },
      { category: 'Skis', price: 300, status: 'RECEPTION_PENDING' },
    ],
  )
}

// ---- deposit --------------------------------------------------------------

export async function depositDurandOn1000() {
  await givenWorkstation(1000)
  const page = await depositAddPage()
  await page.loadPredeposit('Durand Camille')
  await page.chooseStatus('Payé')
  await page.printSummary()
  await page.save()
  await page.savedToast(1001)
}

export async function depositMartinOn1000() {
  await givenWorkstation(1000)
  const page = await depositAddPage()
  await page.fillSeller({
    lastName: 'Martin',
    firstName: 'Lucie',
    phoneNumber: '0600000002',
  })
  await page.addArticle()
  await page.fillArticle(0, article('Snowboard', 'Snowboard', 150))
  await page.addArticle()
  await page.fillArticle(1, article('Casque', 'Alpin', 30))
  await page.chooseStatus('A payer')
  await page.printSummary()
  await page.save()
  await page.savedToast(1002)
}

export async function depositBonOn2000() {
  await givenWorkstation(2000)
  const page = await depositAddPage()
  await page.fillSeller({
    lastName: 'Bon',
    firstName: 'Jean',
    phoneNumber: '0600000003',
  })
  await page.addArticle()
  await page.fillArticle(0, article('Vêtement', 'Alpin', 20))
  await page.addArticle()
  await page.fillArticle(1, article('Gants', 'Alpin', 10))
  await page.chooseStatus('Gratuit')
  await page.printSummary()
  await page.save()
  await page.savedToast(2001)
}

export async function receiveSportPro() {
  await givenWorkstation(2000)
  const page = await proReceptionPage()
  await page.pickPro('Sport')
  await page.scan(code(3, 'A'))
  await waitFor(() => expect(page.scannedCount()).toBe(1))
  await page.scan(code(3, 'B'))
  await waitFor(() => expect(page.scannedCount()).toBe(2))
}

// ---- sale -----------------------------------------------------------------

type Sale = {
  till: number
  saleIndex: number
  codes: Array<string>
  buyer: { lastName: string; firstName: string; phoneNumber: string }
  pay: { cash?: number; card?: number; check?: number; deferred?: number }
}

export async function sell(sale: Sale) {
  await givenWorkstation(sale.till)
  const page = await salesAddPage()
  for (const scanned of sale.codes) await page.scan(scanned)
  await page.fillBuyer(sale.buyer)
  await page.pay(sale.pay)
  await page.save()
  await page.savedToast(sale.saleIndex)
}

export const referenceSales: Array<Sale> = [
  {
    till: 5000,
    saleIndex: 5001,
    codes: [code(1001, 'A'), code(1001, 'B')],
    buyer: { lastName: 'Leroy', firstName: 'Alice', phoneNumber: '0700000001' },
    pay: { cash: 140 },
  },
  {
    till: 5000,
    saleIndex: 5002,
    codes: [code(1002, 'A')],
    buyer: { lastName: 'Petit', firstName: 'Bruno', phoneNumber: '0700000002' },
    pay: { card: 150 },
  },
  {
    till: 6000,
    saleIndex: 6001,
    codes: [code(3, 'A'), code(1002, 'B')],
    buyer: { lastName: 'Roux', firstName: 'Chloé', phoneNumber: '0700000003' },
    pay: { check: 200, cash: 30 },
  },
]

// ---- counting the tills ---------------------------------------------------
// The float is 80 € everywhere: the drawer holds it on top of the takings,
// and the person counting types it.

export async function countSaleTill(
  till: number,
  counts: Array<[Denomination, number]>,
) {
  await givenWorkstation(till)
  const page = await salesControlPage()
  await page.open('drawer')
  await page.setFloat(80)
  for (const [value, n] of counts) await page.count(value, n)
  await page.comment('Comptage du soir')
  await page.print()
  await page.save()
  await page.savedToast(till)
}

export async function countDepositTill(
  till: number,
  counts: Array<[Denomination, number]>,
) {
  await givenWorkstation(till)
  const page = await cashRegisterControlPage()
  await page.setFloat(80)
  for (const [value, n] of counts) await page.count(value, n)
  await page.comment('Comptage du soir')
  await page.print()
  await page.save()
  await page.savedToast(till)
}

export async function countReturnTill(
  till: number,
  counts: Array<[Denomination, number]>,
) {
  await givenWorkstation(till)
  const page = await returnsCashCountPage()
  await page.close(counts, 'Comptage du soir', till)
}

// ---- return ---------------------------------------------------------------

export async function computeTheReturns() {
  await givenWorkstation(7000)
  const page = await returnsListingPage()
  await waitFor(() => expect(page.counters().toCompute).toBe(4))
  const question = await page.computeAll()
  await question.confirm()
  await waitFor(() => expect(page.counters().toCompute).toBe(0))
}

export async function writeCheque(seller: string, checkId: string) {
  await givenWorkstation(7000)
  const page = await returnsIndividualsPage()
  await page.pickDeposit(seller)
  await page.fillCheque({ signatory: `${seller} en personne`, checkId })
  await page.printCheque()
  await page.nextCheque()
  await waitFor(() => expect(page.depositRow()).toBeNull())
}

// ---- the whole day ----------------------------------------------------------

export async function givenTheReferenceBourse() {
  await givenWhatCameBeforeTheDay()

  await depositDurandOn1000()
  await depositMartinOn1000()
  await depositBonOn2000()
  await receiveSportPro()

  for (const sale of referenceSales) await sell(sale)

  // 140 € and 30 € taken in cash, on top of the float.
  await countSaleTill(5000, [
    [200, 1],
    [20, 1],
  ])
  await countSaleTill(6000, [
    [100, 1],
    [10, 1],
  ])
  // Durand's 2 € contribution, paid at till 1000; nothing at till 2000.
  await countDepositTill(1000, [
    [50, 1],
    [20, 1],
    [10, 1],
    [2, 1],
  ])
  await countDepositTill(2000, [
    [50, 1],
    [20, 1],
    [10, 1],
  ])

  await computeTheReturns()
  await writeCheque('Durand', '1001')
  await writeCheque('Martin', '1002')
  // No contribution settled in the evening: the return till holds its float.
  await countReturnTill(7000, [
    [50, 1],
    [20, 1],
    [10, 1],
  ])
}
