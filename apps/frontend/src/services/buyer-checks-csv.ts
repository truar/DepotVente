import { db } from '@/db.ts'
import { csvEuros } from '@/lib/csv.ts'
import { isReportedSaleRegister, sumOf } from '@/pdf/load-bilan-pdf-data.ts'

/**
 * Les chèques des acheteurs, toutes caisses confondues : une ligne par vente
 * réglée (en partie ou en tout) par chèque, puis leur nombre et leur total.
 * Mêmes ventes que la colonne « Chèques » du récap. ventes : ni les ventes
 * supprimées, ni celles de la caisse d'essai 1.
 */
export async function buyerChecksCsvRows(): Promise<Array<Array<string>>> {
  const [sales, contacts] = await Promise.all([
    db.sales.toArray(),
    db.contacts.toArray(),
  ])
  const nameOf = new Map(
    contacts.map((c) => [c.id, `${c.lastName} ${c.firstName}`.trim()]),
  )
  const paidByCheck = sales
    .filter(
      (s) =>
        s.deletedAt == null &&
        isReportedSaleRegister(s.incrementStart) &&
        (s.checkAmount ?? 0) > 0,
    )
    .sort((a, b) => a.saleIndex - b.saleIndex)
  const count = paidByCheck.length
  return [
    ['N° vente', 'Nom', 'Montant'],
    ...paidByCheck.map((s) => [
      String(s.saleIndex),
      nameOf.get(s.buyerId) ?? '',
      csvEuros(s.checkAmount ?? 0),
    ]),
    [
      'Total',
      `${count} chèque${count > 1 ? 's' : ''}`,
      csvEuros(sumOf(paidByCheck, (s) => s.checkAmount ?? 0)),
    ],
  ]
}
