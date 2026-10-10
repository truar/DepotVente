import { Navigate, createFileRoute } from '@tanstack/react-router'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { SalesControlScreen } from '@/components/forms/SalesControlScreen.tsx'

export const Route = createFileRoute(
  '/sales/cash-register-controls/$cashRegisterId',
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
    return <Navigate to="/sales/cash-register-controls" />
  }
  return (
    <SalesControlScreen
      cashRegisterId={cashRegisterId}
      pageTitle={`Contrôle caisse ventes — Caisse ${cashRegisterId}`}
      backLabel="Retour à la liste"
    />
  )
}
