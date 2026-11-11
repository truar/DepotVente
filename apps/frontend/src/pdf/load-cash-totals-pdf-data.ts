import { coupure } from './cash-totals-pdf'
import { add, isReportedSaleRegister, sumOf } from './load-bilan-pdf-data'
import type { CashTotalsData } from './cash-totals-pdf'
import type { BilanAuditGroup } from './load-bilan-pdf-data'
import type { CashRegisterControl } from '@/db'
import { db } from '@/db'
import { fromCents, getYear, toCents } from '@/utils'
import { pdfEur, pdfInt } from '@/pdf/format.ts'

type CountField = keyof Pick<
  CashRegisterControl,
  | 'cash200'
  | 'cash100'
  | 'cash50'
  | 'cash20'
  | 'cash10'
  | 'cash5'
  | 'cash2'
  | 'cash1'
  | 'cash05'
  | 'cash02'
  | 'cash01'
  | 'cash005'
  | 'cash002'
  | 'cash001'
>

// Dans l'ordre du comptage d'une caisse : les billets, puis les pièces.
const DENOMINATIONS: Array<{
  value: number
  field: CountField
  note: boolean
}> = [
  { value: 200, field: 'cash200', note: true },
  { value: 100, field: 'cash100', note: true },
  { value: 50, field: 'cash50', note: true },
  { value: 20, field: 'cash20', note: true },
  { value: 10, field: 'cash10', note: true },
  { value: 5, field: 'cash5', note: true },
  { value: 2, field: 'cash2', note: false },
  { value: 1, field: 'cash1', note: false },
  { value: 0.5, field: 'cash05', note: false },
  { value: 0.2, field: 'cash02', note: false },
  { value: 0.1, field: 'cash01', note: false },
  { value: 0.05, field: 'cash005', note: false },
  { value: 0.02, field: 'cash002', note: false },
  { value: 0.01, field: 'cash001', note: false },
]

const TYPE_LABELS: Record<CashRegisterControl['type'], string> = {
  DEPOSIT: 'dépôt',
  SALE: 'vente',
  RETURN: 'retour',
}

export type CashTotalsResult = {
  data: CashTotalsData
  audit: Array<BilanAuditGroup>
}

/**
 * « Espèces des caisses » : les billets et pièces de tous les contrôles de
 * caisse réunis, comme si chaque tiroir était vidé sur la même table. Tous les
 * types de caisse comptent (dépôt, vente, retour), avec la même règle que le
 * bilan : la caisse 1 n'est écartée que côté vente (saisie d'essai).
 */
export async function loadCashTotalsPdfData(): Promise<CashTotalsResult> {
  const allControls = await db.cashRegisterControls.toArray()
  const controls = allControls.filter(
    (c) =>
      c.deletedAt == null &&
      (c.type !== 'SALE' || isReportedSaleRegister(c.cashRegisterId)),
  )

  const rows = DENOMINATIONS.map(({ value, field, note }) => {
    const count = controls.reduce((acc, c) => acc + (Number(c[field]) || 0), 0)
    // En centimes entiers : 7 × 0,01 € font 0,07 €, pas 0.06999999999999999.
    const amount = fromCents(count * toCents(value))
    return { value, count, amount, note }
  })

  const notesAmount = sumOf(
    rows.filter((r) => r.note),
    (r) => r.amount,
  )
  const coinsAmount = sumOf(
    rows.filter((r) => !r.note),
    (r) => r.amount,
  )
  const countedAmount = add(notesAmount, coinsAmount)
  const initialAmount = sumOf(controls, (c) => c.initialAmount)
  const realAmount = add(countedAmount, -initialAmount)

  const countsByType = (['DEPOSIT', 'SALE', 'RETURN'] as const).map((type) => ({
    type,
    count: controls.filter((c) => c.type === type).length,
  }))
  const controlsSummary = `${pdfInt(controls.length)} contrôle${controls.length > 1 ? 's' : ''} de caisse : ${countsByType
    .map(({ type, count }) => `${pdfInt(count)} ${TYPE_LABELS[type]}`)
    .join(', ')}`

  const tills = (field: CountField) =>
    controls
      .filter((c) => (Number(c[field]) || 0) > 0)
      .map((c) => `${c.cashRegisterId} ${TYPE_LABELS[c.type]} : ${c[field]}`)
      .join(', ') || 'aucune caisse'

  const audit: Array<BilanAuditGroup> = [
    {
      title: `Décompte des espèces (${controlsSummary})`,
      entries: rows.map((r, index) => ({
        label: coupure(r.value),
        value: `${pdfInt(r.count)} × ${coupure(r.value)} = ${pdfEur(r.amount)}`,
        source: `Σ cashRegisterControl.${DENOMINATIONS[index].field} (contrôles non supprimés, caisse 1 vente exclue)`,
        formula: tills(DENOMINATIONS[index].field),
      })),
    },
    {
      title: 'Totaux',
      entries: [
        {
          label: 'Total billets',
          value: pdfEur(notesAmount),
          source: 'Billets de 200 € à 5 €',
          formula: rows
            .filter((r) => r.note)
            .map((r) => pdfEur(r.amount))
            .join(' + '),
        },
        {
          label: 'Total pièces',
          value: pdfEur(coinsAmount),
          source: 'Pièces de 2 € à 0,01 €',
          formula: rows
            .filter((r) => !r.note)
            .map((r) => pdfEur(r.amount))
            .join(' + '),
        },
        {
          label: 'Total compté',
          value: pdfEur(countedAmount),
          source: 'Total billets + total pièces',
          formula: `${pdfEur(notesAmount)} + ${pdfEur(coinsAmount)}`,
        },
        {
          label: 'Fonds de caisse',
          value: pdfEur(initialAmount),
          source: 'Σ cashRegisterControl.initialAmount',
          formula:
            controls
              .map(
                (c) =>
                  `${c.cashRegisterId} ${TYPE_LABELS[c.type]} : ${pdfEur(c.initialAmount)}`,
              )
              .join(', ') || 'aucune caisse',
        },
        {
          label: 'Espèces réelles',
          value: pdfEur(realAmount),
          source: 'Total compté − fonds de caisse',
          formula: `${pdfEur(countedAmount)} − ${pdfEur(initialAmount)}`,
        },
      ],
    },
  ]

  return {
    data: {
      year: getYear(),
      controlsSummary,
      rows: rows.map(({ value, count, amount }) => ({ value, count, amount })),
      notesAmount,
      coinsAmount,
      countedAmount,
      initialAmount,
      realAmount,
    },
    audit,
  }
}
