import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Loader2 } from 'lucide-react'
import { requireAdmin } from '@/lib/route-guards'
import { RecapVentesPdf } from '@/pdf/recap-ventes-pdf.tsx'
import { loadRecapVentesPdfData } from '@/pdf/load-recap-ventes-pdf-data.ts'
import { ReportAuditLayout } from '@/components/ReportAuditLayout.tsx'
import { Button } from '@/components/ui/button.tsx'
import { downloadCsv } from '@/lib/csv.ts'
import { buyerChecksCsvRows } from '@/services/buyer-checks-csv.ts'

export const Route = createFileRoute('/reports/summary-sales')({
  beforeLoad: requireAdmin,
  component: RouteComponent,
})

function RouteComponent() {
  const result = useLiveQuery(() => loadRecapVentesPdfData(), [])

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    )
  }

  const exportBuyerChecks = async () => {
    downloadCsv('cheques-clients.csv', await buyerChecksCsvRows())
  }

  return (
    <ReportAuditLayout
      title="Récapitulatif des ventes"
      audit={result.audit}
      actions={
        <Button size="sm" variant="outline" onClick={exportBuyerChecks}>
          <Download />
          Exporter les chèques clients (CSV)
        </Button>
      }
    >
      <PDFViewer width="100%" height="100%" style={{ height: '100%' }}>
        <RecapVentesPdf data={result.data} />
      </PDFViewer>
    </ReportAuditLayout>
  )
}
