import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2 } from 'lucide-react'
import { requireAdmin } from '@/lib/route-guards'
import { MaterialProPdf } from '@/pdf/material-pro-pdf.tsx'
import { loadMaterialProPdfData } from '@/pdf/load-material-pro-pdf-data.ts'
import { ReportAuditLayout } from '@/components/ReportAuditLayout.tsx'

export const Route = createFileRoute('/reports/material-pro')({
  beforeLoad: requireAdmin,
  component: RouteComponent,
})

function RouteComponent() {
  const result = useLiveQuery(() => loadMaterialProPdfData(), [])

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <ReportAuditLayout title="Bilan matériel pro (par fiche)" audit={result.audit}>
      {result.data.fiches.length === 0 ? (
        <div className="flex h-full items-center justify-center p-8 text-center text-gray-500">
          Aucune fiche pro avec des articles à afficher.
        </div>
      ) : (
        <PDFViewer width="100%" height="100%" style={{ height: '100%' }}>
          <MaterialProPdf data={result.data} />
        </PDFViewer>
      )}
    </ReportAuditLayout>
  )
}
