import { createFileRoute } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { getYear } from '@/utils'
import { SaleCashRegisterControlPdf } from '@/pdf/sale-cash-register-control-pdf.tsx'

export const Route = createFileRoute('/hidden-pdfs/sale-cash-register-control')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  return (
    <PDFViewer width={1000} height={1500}>
      <SaleCashRegisterControlPdf
        data={{
          cashRegisterId: 1000,
          year: getYear(),
          cardPayments: Array.from({ length: 10 }).map(() => ({
            amount: 10,
            buyerCity: 'Rumilly',
            buyerPhoneNumber: '0102030405',
            buyerName: 'Toto titi',
            saleIndex: 1001,
          })),
          checkPayments: Array.from({ length: 10 }).map(() => ({
            amount: 15,
            buyerCity: 'Rumilly',
            buyerPhoneNumber: '0102030405',
            buyerName: 'Toto titi',
            saleIndex: 1001,
          })),
          refundPayments: Array.from({ length: 10 }).map(() => ({
            amount: 15,
            type: 'CB',
            comment: 'A comment',
            buyerCity: 'Rumilly',
            buyerPhoneNumber: '0102030405',
            buyerName: 'Toto titi',
            saleIndex: 1001,
          })),
          cashPayment: {
            initialAmount: 80,
            realAmount: 750,
            theoreticalAmount: 725,
            amounts: [
              { amount: 2, value: 200 },
              { amount: 3, value: 100 },
              { amount: 0, value: 50 },
              { amount: 0, value: 20 },
              { amount: 3, value: 10 },
              { amount: 4, value: 5 },
              { amount: 0, value: 2 },
              { amount: 0, value: 1 },
              { amount: 0, value: 0.5 },
              { amount: 0, value: 0.2 },
              { amount: 0, value: 0.1 },
              { amount: 0, value: 0.05 },
              { amount: 0, value: 0.02 },
              { amount: 0, value: 0.01 },
            ],
          },
        }}
      />
    </PDFViewer>
  )
}
