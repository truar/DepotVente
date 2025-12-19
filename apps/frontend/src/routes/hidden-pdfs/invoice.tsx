import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { InvoicePdf } from '@/pdf/invoice-pdf.tsx'

export const Route = createFileRoute('/hidden-pdfs/invoice')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PDFViewer width={1000} height={1500}>
      <InvoicePdf
        data={{
          contact: {
            lastName: 'Donsez sperber',
            firstName: 'Thibault',
            phoneNumber: '0102030405',
          },
          sale: {
            saleIndex: 1001,
            date: new Date(),
            year: 2025,
          },
          articles: Array.from({ length: 10 }).map(() => ({
            code: '2025 1001A',
            model: 'Zenith',
            category: 'Skis',
            brand: 'Rossignol',
            discipline: 'Alpin',
            price: 15,
          })),
        }}
      />
    </PDFViewer>
  )
}
