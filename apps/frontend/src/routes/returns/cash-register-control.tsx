import { createFileRoute } from '@tanstack/react-router'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { ReturnCashRegisterControlScreen } from '@/components/forms/ReturnCashRegisterControlScreen.tsx'

export const Route = createFileRoute('/returns/cash-register-control')({
  beforeLoad: requireAdminAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const [workstation] = useWorkstation()
  return (
    <ReturnCashRegisterControlScreen
      cashRegisterId={workstation.incrementStart}
      pageTitle="Contrôler les espèces (retours)"
    />
  )
}
