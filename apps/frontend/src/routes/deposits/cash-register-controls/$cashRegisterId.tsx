import { Navigate, createFileRoute } from '@tanstack/react-router'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { DepositCashRegisterControlScreen } from '@/components/forms/DepositCashRegisterControlScreen.tsx'

export const Route = createFileRoute(
  '/deposits/cash-register-controls/$cashRegisterId',
)({
  beforeLoad: requireAdminAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const cashRegisterId = Number(Route.useParams().cashRegisterId)
  // Un numéro tapé à la main qui n'en est pas un : IndexedDB refuserait de le
  // chercher.
  if (!Number.isInteger(cashRegisterId) || cashRegisterId <= 0) {
    return <Navigate to="/deposits/cash-register-controls" />
  }
  return (
    <DepositCashRegisterControlScreen
      cashRegisterId={cashRegisterId}
      pageTitle={`Contrôle caisse dépôts — Caisse ${cashRegisterId}`}
      backLabel="Retour à la liste"
    />
  )
}
