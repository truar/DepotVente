import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { requireAdmin } from '@/lib/route-guards'
import { SaleCashRegisterDetailPdf } from '@/pdf/sale-cash-register-control-pdf.tsx'
import {
  loadSaleControlDetailPdfData,
  loadSaleTills,
} from '@/pdf/load-sale-control-detail-pdf-data.ts'
import { ReportAuditLayout } from '@/components/ReportAuditLayout.tsx'

export const Route = createFileRoute('/reports/sale-tills')({
  beforeLoad: requireAdmin,
  component: RouteComponent,
})

// Le détail d'une caisse de vente, vente par vente : ce que le contrôle de
// caisse imprimait avant de tenir sur une page, réservé aux administrateurs.
function RouteComponent() {
  const tills = useLiveQuery(() => loadSaleTills(), [])
  const [chosen, setChosen] = useState<number | null>(null)
  const till = chosen ?? tills?.[0] ?? null
  const result = useLiveQuery(
    () => (till == null ? undefined : loadSaleControlDetailPdfData(till)),
    [till],
  )

  if (tills && tills.length === 0) {
    return (
      <ReportAuditLayout title="Détail caisse de vente" audit={[]}>
        <p className="p-6 text-gray-600">Aucune caisse de vente.</p>
      </ReportAuditLayout>
    )
  }
  // Tant que la caisse choisie se charge, useLiveQuery rend encore la
  // précédente : on attend la bonne plutôt que d'afficher l'autre.
  if (!tills || result?.data.cashRegisterId !== till) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <ReportAuditLayout
      title="Détail caisse de vente"
      audit={result.audit}
      toolbar={
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Caisse
          <select
            aria-label="Caisse"
            className="rounded border border-gray-300 px-2 py-1"
            value={String(till)}
            onChange={(e) => setChosen(Number(e.target.value))}
          >
            {tills.map((t) => (
              <option key={t} value={String(t)}>
                {t}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <PDFViewer
        key={till}
        width="100%"
        height="100%"
        style={{ height: '100%' }}
      >
        <SaleCashRegisterDetailPdf data={result.data} />
      </PDFViewer>
    </ReportAuditLayout>
  )
}
