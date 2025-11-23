import { createFileRoute } from '@tanstack/react-router'
import { DepositPdf } from '@/pdf/deposit-pdf.tsx'
import { PDFViewer } from '@react-pdf/renderer'

export const Route = createFileRoute('/hidden-pdfs/summary-deposits')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PDFViewer width={1000} height={1500}>
      <DepositPdf
        data={{
          contact: {
            lastName: 'Donsez sperber',
            firstName: 'Thibault',
            city: 'Rumilly',
            phoneNumber: '0102030405',
          },
          deposit: {
            depositIndex: 1001,
            year: 2025,
            contributionAmount: 2,
            contributionStatus: 'PAYEE',
          },
          articles: Array.from({ length: 100 }).map(() => ({
            shortCode: '1001 A',
            model: 'Zenith',
            color: 'Rouge blanc',
            category: 'Skis',
            brand: 'Rossignol',
            size: '170',
            discipline: 'Alpin',
            price: 15,
          })),
        }}
      />
    </PDFViewer>
  )
}
