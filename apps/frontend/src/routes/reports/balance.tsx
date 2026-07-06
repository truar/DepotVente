import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2 } from 'lucide-react'
import { requireAdmin } from '@/lib/route-guards'
import { BilanPdf } from '@/pdf/bilan-pdf.tsx'
import { loadBilanPdfData } from '@/pdf/load-bilan-pdf-data.ts'
import { ReportAuditLayout } from '@/components/ReportAuditLayout.tsx'

export const Route = createFileRoute('/reports/balance')({
  beforeLoad: requireAdmin,
  component: RouteComponent,
})

function RouteComponent() {
  const result = useLiveQuery(() => loadBilanPdfData(), [])

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <ReportAuditLayout title="Bilan de la bourse" audit={result.audit}>
      <PDFViewer width="100%" height="100%" style={{ height: '100%' }}>
        <BilanPdf data={result.data} />
      </PDFViewer>
    </ReportAuditLayout>
  )
}
