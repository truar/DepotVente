import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { SellerCheckPdf } from '@/pdf/seller-check.tsx'

export const Route = createFileRoute('/hidden-pdfs/seller-check')({
  component: RouteComponent,
})
function RouteComponent() {
  return (
    <PDFViewer width={1000} height={1500}>
      <SellerCheckPdf
        data={{
          seller: 'Toto Titi',
          date: new Date(2025, 3, 23),
          textualAmount: 'cent cinquante deux euro et trois centimes',
          city: 'Rumilly',
          amount: 152.03,
        }}
      />
    </PDFViewer>
  )
}
