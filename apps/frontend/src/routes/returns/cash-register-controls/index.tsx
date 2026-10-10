import { createFileRoute } from '@tanstack/react-router'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { CashRegisterControlsScreen } from '@/components/CashRegisterControlsScreen.tsx'

export const Route = createFileRoute('/returns/cash-register-controls/')({
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
      type="RETURN"
      title="Contrôles caisses retours"
      detailRoute="/returns/cash-register-controls/$cashRegisterId"
    />
  )
}
