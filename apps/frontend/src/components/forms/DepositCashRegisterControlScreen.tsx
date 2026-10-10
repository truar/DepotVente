import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db.ts'
import { CashRegisterControlScreen } from '@/components/forms/CashRegisterControlScreen.tsx'

export type DepositCashRegisterControlScreenProps = {
  cashRegisterId: number
  pageTitle: string
  backLabel?: string
}

export function DepositCashRegisterControlScreen(
  props: DepositCashRegisterControlScreenProps,
) {
  const { cashRegisterId, pageTitle, backLabel } = props
  // Théorique de la caisse de dépôt : les cotisations réglées sur place, par
  // les déposants enregistrés sur cette caisse.
  const deposits = useLiveQuery(
    () =>
      db.deposits
        .where({
          incrementStart: cashRegisterId,
        })
        .toArray(),
    [cashRegisterId],
  )
  const theoreticalAmount =
    deposits?.reduce((acc, deposit) => {
      const amount =
        deposit.contributionStatus === 'PAYE' ? deposit.contributionAmount : 0
      return acc + amount
    }, 0) ?? 0

  return (
    <CashRegisterControlScreen
      type="DEPOSIT"
      cashRegisterId={cashRegisterId}
      pageTitle={pageTitle}
      pdfTitle="Contrôle caisse dépôts"
      theoreticalAmount={theoreticalAmount}
      backLabel={backLabel}
    />
  )
}
