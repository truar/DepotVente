import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { CashRegisterControlScreen } from '@/components/forms/CashRegisterControlScreen.tsx'
import { FormattedNumber } from 'react-intl'

export const Route = createFileRoute('/returns/cash-register-control')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const [workstation] = useWorkstation()
  // contributionStatus n'est pas indexé : un scan complet suffit largement sur
  // quelques milliers de fiches, et évite une migration Dexie en pleine bourse.
  const settled = useLiveQuery(
    () =>
      db.deposits
        .filter(
          (deposit) =>
            deposit.deletedAt == null &&
            deposit.contributionStatus === 'SOLDE' &&
            deposit.contributionCollectWorkstationId ===
              workstation.incrementStart,
        )
        .toArray(),
    [workstation.incrementStart],
  )
  const theoreticalAmount =
    settled?.reduce((acc, deposit) => acc + deposit.contributionAmount, 0) ?? 0

  return (
    <>
      <UnattributedSettlements />
      <CashRegisterControlScreen
        type="RETURN"
        pageTitle="Contrôler les espèces (retours)"
        pdfTitle="Contrôle caisse retours"
        theoreticalAmount={theoreticalAmount}
      />
    </>
  )
}

/**
 * Une cotisation soldée sans caisse d'encaissement n'est comptée dans le
 * théorique d'aucune caisse : elle apparaîtrait sinon comme un surplus
 * inexpliqué chez celle qui détient réellement les espèces.
 */
function UnattributedSettlements() {
  const orphans = useLiveQuery(
    () =>
      db.deposits
        .filter(
          (deposit) =>
            deposit.deletedAt == null &&
            deposit.contributionStatus === 'SOLDE' &&
            deposit.contributionCollectWorkstationId == null,
        )
        .toArray(),
    [],
  )
  if (!orphans || orphans.length === 0) return null
  const amount = orphans.reduce((acc, d) => acc + d.contributionAmount, 0)
  return (
    <div className="mx-6 mt-4 rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-amber-900">
      {orphans.length} cotisation(s) soldée(s) sans caisse d'encaissement (
      <FormattedNumber value={amount} style="currency" currency="EUR" />) : ces
      cotisations ne sont comptées dans le montant théorique d'aucune caisse.
    </div>
  )
}
