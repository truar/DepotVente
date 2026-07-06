import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2 } from 'lucide-react'
import { requireAdmin } from '@/lib/route-guards'
import { RecapDepotsPdf } from '@/pdf/recap-depots-pdf.tsx'
import { loadRecapDepotsPdfData } from '@/pdf/load-recap-depots-pdf-data.ts'
import { ReportAuditLayout } from '@/components/ReportAuditLayout.tsx'

export const Route = createFileRoute('/reports/summary-deposits')({
  beforeLoad: requireAdmin,
  component: RouteComponent,
})

function RouteComponent() {
  const result = useLiveQuery(() => loadRecapDepotsPdfData(), [])

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <ReportAuditLayout
      title="Récapitulatifs dépôts/pré-dépôts"
      audit={result.audit}
    >
      <PDFViewer width="100%" height="100%" style={{ height: '100%' }}>
        <RecapDepotsPdf data={result.data} />
      </PDFViewer>
    </ReportAuditLayout>
  )
}
