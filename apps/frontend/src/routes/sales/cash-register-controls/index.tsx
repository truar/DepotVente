import { createFileRoute } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { CashRegisterControlsScreen } from '@/components/CashRegisterControlsScreen.tsx'
import { Button } from '@/components/ui/button.tsx'
import { downloadCsv } from '@/lib/csv.ts'
import { buyerChecksCsvRows } from '@/services/buyer-checks-csv.ts'

export const Route = createFileRoute('/sales/cash-register-controls/')({
  beforeLoad: requireAdminAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  // Les chèques des acheteurs, toutes caisses confondues, pour la remise en
  // banque.
  const exportBuyerChecks = async () => {
    downloadCsv('cheques-clients.csv', await buyerChecksCsvRows())
  }

  return (
    <CashRegisterControlsScreen
      type="SALE"
      title="Contrôles caisses ventes"
      detailRoute="/sales/cash-register-controls/$cashRegisterId"
      actions={
        <Button variant="outline" onClick={exportBuyerChecks}>
          <Download />
          Exporter les chèques clients (CSV)
        </Button>
      }
    />
  )
}
