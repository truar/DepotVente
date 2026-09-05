import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { CashRegisterControlScreen } from '@/components/forms/CashRegisterControlScreen.tsx'

export const Route = createFileRoute('/deposits/cash-register-control')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const [workstation] = useWorkstation()
  // Théorique de la caisse de dépôt : les cotisations réglées sur place, par
  // les déposants enregistrés sur cette caisse.
  const deposits = useLiveQuery(
    () =>
      db.deposits
        .where({
          incrementStart: workstation.incrementStart,
        })
        .toArray(),
    [workstation.incrementStart],
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
      pageTitle="Contrôler les espèces"
      pdfTitle="Contrôle caisse dépôts"
      theoreticalAmount={theoreticalAmount}
    />
  )
}
