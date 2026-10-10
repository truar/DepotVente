import { createFileRoute } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { SalesControlScreen } from '@/components/forms/SalesControlScreen.tsx'

export const Route = createFileRoute('/sales/sales-control')({
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
    <SalesControlScreen
      cashRegisterId={workstation.incrementStart}
      pageTitle="Contrôler la caisse"
    />
  )
}
