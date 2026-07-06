import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2 } from 'lucide-react'
import { requireAdmin } from '@/lib/route-guards'
import { MaterialPdf } from '@/pdf/material-pdf.tsx'
import { loadMaterialPdfData } from '@/pdf/load-material-pdf-data.ts'
import { ReportAuditLayout } from '@/components/ReportAuditLayout.tsx'

export const Route = createFileRoute('/reports/material')({
  beforeLoad: requireAdmin,
  component: RouteComponent,
})

function RouteComponent() {
  const result = useLiveQuery(() => loadMaterialPdfData(), [])

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <ReportAuditLayout title="Bilan matériel (global)" audit={result.audit}>
      <PDFViewer width="100%" height="100%" style={{ height: '100%' }}>
        <MaterialPdf data={result.data} />
      </PDFViewer>
    </ReportAuditLayout>
  )
}
