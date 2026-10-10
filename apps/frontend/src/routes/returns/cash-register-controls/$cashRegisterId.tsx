import { Navigate, createFileRoute } from '@tanstack/react-router'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { ReturnCashRegisterControlScreen } from '@/components/forms/ReturnCashRegisterControlScreen.tsx'

export const Route = createFileRoute(
  '/returns/cash-register-controls/$cashRegisterId',
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
    return <Navigate to="/returns/cash-register-controls" />
  }
  return (
    <ReturnCashRegisterControlScreen
      cashRegisterId={cashRegisterId}
      pageTitle={`Contrôle caisse retours — Caisse ${cashRegisterId}`}
      backLabel="Retour à la liste"
    />
  )
}
