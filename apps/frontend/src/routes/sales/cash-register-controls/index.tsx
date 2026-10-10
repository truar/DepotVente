import { createFileRoute } from '@tanstack/react-router'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { CashRegisterControlsScreen } from '@/components/CashRegisterControlsScreen.tsx'

export const Route = createFileRoute('/sales/cash-register-controls/')({
  beforeLoad: requireAdminAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  return (
    <CashRegisterControlsScreen
      type="SALE"
      title="Contrôles caisses ventes"
      detailRoute="/sales/cash-register-controls/$cashRegisterId"
    />
  )
}
