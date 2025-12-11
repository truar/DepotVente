import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { ReturnDepositPdf } from '@/pdf/return-deposit-pdf.tsx'

export const Route = createFileRoute('/hidden-pdfs/summary-return-deposits')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PDFViewer width={1000} height={1500}>
      <ReturnDepositPdf
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
            totalAmount: 30000,
            clubAmount: 4.5,
            countSoldArticles: 3,
            dueAmount: 40.5,
          },
          articles: Array.from({ length: 10 }).map(() => ({
            shortCode: '1001 A',
            model: 'Zenith',
            color: 'Rouge blanc',
            category: 'Skis',
            brand: 'Rossignol',
            size: '170',
            discipline: 'Alpin',
            price: 1000,
            isSold: Math.random() < 0.5,
          })),
        }}
      />
    </PDFViewer>
  )
}
