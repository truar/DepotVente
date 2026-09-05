import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { DepositCashRegisterControlPdf } from '@/pdf/deposit-cash-register-control-pdf.tsx'
import { getYear } from '@/utils'

export const Route = createFileRoute(
  '/hidden-pdfs/return-cash-register-control',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PDFViewer width={1000} height={1500}>
      <DepositCashRegisterControlPdf
        data={{
          title: 'Contrôle caisse retours',
          initialAmount: 80,
          realAmount: 46,
          theoreticalAmount: 44,
          cashRegisterId: 3000,
          year: getYear(),
          amounts: [
            { amount: 0, value: 200 },
            { amount: 0, value: 100 },
            { amount: 0, value: 50 },
            { amount: 4, value: 20 },
            { amount: 4, value: 10 },
            { amount: 0, value: 5 },
            { amount: 3, value: 2 },
            { amount: 0, value: 1 },
            { amount: 0, value: 0.5 },
            { amount: 0, value: 0.2 },
            { amount: 0, value: 0.1 },
            { amount: 0, value: 0.05 },
            { amount: 0, value: 0.02 },
            { amount: 0, value: 0.01 },
          ],
        }}
      />
    </PDFViewer>
  )
}
