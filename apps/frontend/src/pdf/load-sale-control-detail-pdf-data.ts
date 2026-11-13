import type { SaleCashRegisterControlProps } from './sale-cash-register-control-pdf'
import type { BilanAuditGroup } from '@/pdf/load-bilan-pdf-data.ts'
import type { CashRegisterControl, Contact, Sale } from '@/db'
import { db } from '@/db'
import { fromCents, getYear, toCents } from '@/utils'
import { add, sumOf } from '@/pdf/load-bilan-pdf-data.ts'

type ControlData = SaleCashRegisterControlProps['data']
export type SaleControlRows = Pick<
  ControlData,
  | 'cardPayments'
  | 'checkPayments'
  | 'deferredPayments'
  | 'cashSales'
  | 'refundPayments'
>

function computeSaleTotal(sale: Sale): number {
  return fromCents(
    toCents(sale.cardAmount ?? 0) +
      toCents(sale.cashAmount ?? 0) +
      toCents(sale.checkAmount ?? 0) +
      toCents(sale.deferredAmount ?? 0) -
      toCents(sale.totalRefundAmount),
  )
}

const bySaleIndex = (a: { saleIndex: number }, b: { saleIndex: number }) =>
  a.saleIndex - b.saleIndex

/**
 * Les ventes d'une caisse rangées sous chaque mode de paiement, telles que le
 * contrôle de caisse les montre : la carte et les espèces avec, en négatif,
 * ce que cette caisse a rendu ; les remboursements faits ici, quelle que soit
 * la caisse de la vente.
 */
export async function loadSaleControlRows(
  cashRegisterId: number,
): Promise<SaleControlRows> {
  const [allSales, contacts, refunds] = await Promise.all([
    db.sales.toArray(),
    db.contacts.toArray(),
    db.refunds
      .where({ incrementStart: cashRegisterId })
      .and((refund) => refund.deletedAt == null)
      .toArray(),
  ])
  const saleMap = new Map<string, Sale>(allSales.map((s) => [s.id, s]))
  const contactMap = new Map<string, Contact>(contacts.map((c) => [c.id, c]))
  const sales = allSales
    .filter((sale) => sale.incrementStart === cashRegisterId)
    .sort(bySaleIndex)

  const rowOf = (sale: Sale, amount: number) => {
    const buyer = contactMap.get(sale.buyerId)
    if (!buyer) return []
    return [
      {
        saleIndex: sale.saleIndex,
        buyerName: `${buyer.lastName} ${buyer.firstName}`,
        buyerPhoneNumber: buyer.phoneNumber,
        buyerCity: buyer.city || '',
        amount,
        saleTotal: computeSaleTotal(sale),
      },
    ]
  }
  const salesPaidBy = (amountOf: (sale: Sale) => number | null | undefined) =>
    sales
      .filter((sale) => (amountOf(sale) ?? 0) > 0)
      .flatMap((sale) => rowOf(sale, amountOf(sale) ?? 0))
  const refundRows = (amountOf: (refund: (typeof refunds)[number]) => number) =>
    refunds
      .filter((refund) => amountOf(refund) > 0)
      .flatMap((refund) => {
        const sale = saleMap.get(refund.saleId)
        return sale ? rowOf(sale, -amountOf(refund)) : []
      })

  const refundPayments: ControlData['refundPayments'] = refunds
    .flatMap((refund) => {
      const sale = saleMap.get(refund.saleId)
      if (!sale) return []
      return rowOf(sale, 0).flatMap((base) => {
        const rows: ControlData['refundPayments'] = []
        const comment = refund.comment || ''
        if (refund.cardAmount > 0) {
          rows.push({ ...base, comment, type: 'CB', amount: refund.cardAmount })
        }
        if (refund.cashAmount > 0) {
          rows.push({
            ...base,
            comment,
            type: 'CASH',
            amount: refund.cashAmount,
          })
        }
        return rows
      })
    })
    .sort(bySaleIndex)

  return {
    cardPayments: [
      ...salesPaidBy((s) => s.cardAmount),
      ...refundRows((r) => r.cardAmount),
    ].sort(bySaleIndex),
    checkPayments: salesPaidBy((s) => s.checkAmount),
    deferredPayments: salesPaidBy((s) => s.deferredAmount),
    cashSales: [
      ...salesPaidBy((s) => s.cashAmount),
      ...refundRows((r) => r.cashAmount),
    ].sort(bySaleIndex),
    refundPayments,
  }
}

/** Les caisses de vente qui ont vendu, rendu ou été comptées. */
export async function loadSaleTills(): Promise<Array<number>> {
  const [sales, refunds, controls] = await Promise.all([
    db.sales.toArray(),
    db.refunds.toArray(),
    db.cashRegisterControls.toArray(),
  ])
  return [
    ...new Set([
      ...sales.map((s) => s.incrementStart),
      ...refunds.filter((r) => r.deletedAt == null).map((r) => r.incrementStart),
      ...controls
        .filter((c) => c.deletedAt == null && c.type === 'SALE')
        .map((c) => c.cashRegisterId),
    ]),
  ].sort((a, b) => a - b)
}

const DENOMINATIONS: Array<[keyof CashRegisterControl, number]> = [
  ['cash200', 200],
  ['cash100', 100],
  ['cash50', 50],
  ['cash20', 20],
  ['cash10', 10],
  ['cash5', 5],
  ['cash2', 2],
  ['cash1', 1],
  ['cash05', 0.5],
  ['cash02', 0.2],
  ['cash01', 0.1],
  ['cash005', 0.05],
  ['cash002', 0.02],
  ['cash001', 0.01],
]

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})
const eur = (n: number) => eurFmt.format(n)

export type SaleControlDetailResult = {
  data: ControlData
  audit: Array<BilanAuditGroup>
  counted: boolean
}

/**
 * Le détail d'une caisse de vente pour les administrateurs : les mêmes
 * lignes que son contrôle de caisse, et le comptage tel qu'il a été
 * enregistré (vide si la caisse n'a pas encore été comptée).
 */
export async function loadSaleControlDetailPdfData(
  cashRegisterId: number,
): Promise<SaleControlDetailResult> {
  const [rows, control] = await Promise.all([
    loadSaleControlRows(cashRegisterId),
    db.cashRegisterControls
      .where({ cashRegisterId })
      .and((c) => c.deletedAt == null && c.type === 'SALE')
      .first(),
  ])
  const data: ControlData = {
    year: getYear(),
    cashRegisterId,
    ...rows,
    cashPayment: {
      initialAmount: control?.initialAmount ?? 0,
      realAmount: control?.totalAmount ?? 0,
      theoreticalAmount: control?.theoreticalCashAmount ?? 0,
      amounts: DENOMINATIONS.map(([field, value]) => ({
        value,
        amount: control ? Number(control[field] ?? 0) : 0,
      })),
      comment: control?.comment ?? null,
    },
  }

  const amounts = (list: Array<{ amount: number }>) =>
    sumOf(list, (row) => row.amount)
  const cards = sumOf(
    rows.cardPayments.filter((row) => row.amount > 0),
    (row) => row.amount,
  )
  const cardRefunds = sumOf(
    rows.refundPayments.filter((row) => row.type === 'CB'),
    (row) => -row.amount,
  )
  const lines: Array<[string, number, string]> = [
    ['Cartes', cards, `${rows.cardPayments.length} ligne(s) CB`],
    [
      'Espèces comptées',
      data.cashPayment.realAmount,
      control ? 'comptage enregistré, hors fond de caisse' : 'caisse non comptée',
    ],
    ['Chèques', amounts(rows.checkPayments), `${rows.checkPayments.length} vente(s)`],
    [
      'Différé',
      amounts(rows.deferredPayments),
      `${rows.deferredPayments.length} vente(s)`,
    ],
    ['Remboursements CB', cardRefunds, 'remboursements CB faits à cette caisse'],
  ]
  const total = add(...lines.map(([, amount]) => amount))
  const audit: Array<BilanAuditGroup> = [
    {
      title: `Caisse ${cashRegisterId}`,
      entries: [
        ...lines.map(([label, amount, formula]) => ({
          label,
          value: eur(amount),
          source: 'ventes de la caisse',
          formula,
        })),
        {
          label: 'Total',
          value: eur(total),
          source: 'somme des modes de paiement',
          formula: lines.map(([, amount]) => eur(amount)).join(' + '),
        },
        {
          label: 'Différence',
          value: eur(
            add(data.cashPayment.realAmount, -data.cashPayment.theoreticalAmount),
          ),
          source: 'espèces comptées − espèces théoriques',
          formula: `${eur(data.cashPayment.realAmount)} − ${eur(data.cashPayment.theoreticalAmount)}`,
        },
      ],
    },
  ]
  return { data, audit, counted: control != null }
}
