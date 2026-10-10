import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { DepositCashRegisterControlScreen } from '@/components/forms/DepositCashRegisterControlScreen.tsx'

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
  return (
    <DepositCashRegisterControlScreen
      cashRegisterId={workstation.incrementStart}
      pageTitle="Contrôler les espèces"
    />
  )
}
