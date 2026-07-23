import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { FormattedNumber, IntlProvider } from 'react-intl'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'
import { PdfCommentSection } from '@/pdf/comment-section.tsx'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
    fontSize: 14,
    gap: 20,
  },
  header: {
    fontStyle: 'italic',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  globalInformation: {
    maxWidth: 250,
    gap: 5,
  },
  pickupInformation: {
    fontSize: 11,
  },
  information: {
    fontWeight: 'bold',
    fontSize: 9,
    flexDirection: 'column',
    gap: 3,
  },
  title: {
    gap: 5,
  },
  libelle: {
    width: 250,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountList: {
    display: 'flex',
    gap: 3,
  },
  payments: {
    flexDirection: 'column',
    gap: 5,
  },
  table: {
    marginTop: 10,
    fontSize: 8,
    display: 'flex',
    width: 'auto',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 2,
    borderBottomWidth: 1,
    borderColor: 'grey',
  },
  tableCol: {
    width: '16%',
  },
  tableColPrice: {
    textAlign: 'right',
    width: '18%',
    paddingRight: 10,
  },
  headerCell: {
    fontStyle: 'italic',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableRowMismatch: {
    backgroundColor: '#fef3c7',
  },
  tableTotalRow: {
    margin: 'auto',
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 2,
    backgroundColor: '#e5e7eb',
  },
  totalLabel: {
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
  },

  refundTable: {
    marginTop: 10,
    fontSize: 8,
    display: 'flex',
    width: 'auto',
  },
  refundTableRow: {
    margin: 'auto',
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 2,
    borderBottomWidth: 1,
    borderColor: 'grey',
  },
  refundTableCol: {
    width: '12%',
  },
  refundTableColPrice: {
    textAlign: 'right',
    width: '14%',
    paddingRight: 10,
  },
  refundHeaderCell: {
    fontStyle: 'italic',
  },
  refundTableHeader: {
    backgroundColor: '#f3f4f6',
  },
  pageInformation: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    fontSize: 8,
  },
})

export type SaleCashRegisterControlProps = {
  copy?: number
  data: {
    cardPayments: Array<{
      saleIndex: number
      buyerName: string
      buyerPhoneNumber: string
      buyerCity: string
      amount: number
      saleTotal: number
    }>
    checkPayments: Array<{
      saleIndex: number
      buyerName: string
      buyerPhoneNumber: string
      buyerCity: string
      amount: number
      saleTotal: number
    }>
    cashSales: Array<{
      saleIndex: number
      buyerName: string
      buyerPhoneNumber: string
      buyerCity: string
      amount: number
      saleTotal: number
    }>
    deferredPayments: Array<{
      saleIndex: number
      buyerName: string
      buyerPhoneNumber: string
      buyerCity: string
      amount: number
      saleTotal: number
    }>
    refundPayments: Array<{
      saleIndex: number
      buyerName: string
      buyerPhoneNumber: string
      buyerCity: string
      type: 'CB' | 'CASH'
      comment: string
      amount: number
      saleTotal: number
    }>
    cashPayment: {
      initialAmount: number
      realAmount: number
      theoreticalAmount: number
      amounts: Array<{ value: number; amount: number }>
      comment?: string | null
    }
    year: number
    cashRegisterId: number
  }
}

export const SaleCashRegisterControlPdf = (
  props: SaleCashRegisterControlProps,
) => {
  const { data, copy = 1 } = props
  const { cashPayment } = data
  return (
    <IntlProvider locale={'fr'}>
      <Document>
        {Array.from({ length: copy }).flatMap((_, index) => [
          <PaymentsPage
            key={`cb-${index}`}
            data={data}
            title="Paiement CB"
            payments={data.cardPayments}
          />,
          <PaymentsPage
            key={`cash-${index}`}
            data={data}
            title="Paiement Espèces — détail"
            payments={data.cashSales}
          />,
          <CashPaymentPage
            key={`cash-control-${index}`}
            data={data}
            cashPayment={cashPayment}
          />,
          <PaymentsPage
            key={`check-${index}`}
            data={data}
            title="Paiement Chèques"
            payments={data.checkPayments}
          />,
          <PaymentsPage
            key={`deferred-${index}`}
            data={data}
            title="Paiement différés"
            payments={data.deferredPayments}
          />,
          <RefundPaymentsPage
            key={`refund-${index}`}
            data={data}
            title="Remboursements"
            payments={data.refundPayments}
            comment={cashPayment.comment}
          />,
        ])}
      </Document>
    </IntlProvider>
  )
}

function GlobalHeader({
  year,
  cashRegisterId,
}: {
  year: number
  cashRegisterId: number
}) {
  return (
    <View style={styles.header} fixed>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        <CMRLogo />
        <View style={styles.title}>
          <Text>Bourse au skis {year}</Text>
          <Text>Club Montagnard Rumillien</Text>
          <Text>Contrôle caisse ventes</Text>
        </View>
      </View>
      <View>
        <View>
          <Text>N° {cashRegisterId}</Text>
        </View>
      </View>
    </View>
  )
}

function PageFooter() {
  return (
    <>
      <View fixed style={styles.pageInformation}>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} sur ${totalPages}`
          }
        />
      </View>
      <PdfTimestampFooter />
    </>
  )
}

function PaymentsPage({
  data,
  payments,
  title,
}: {
  data: SaleCashRegisterControlProps['data']
  title: string
  payments:
    | SaleCashRegisterControlProps['data']['cardPayments']
    | SaleCashRegisterControlProps['data']['checkPayments']
    | SaleCashRegisterControlProps['data']['cashSales']
    | SaleCashRegisterControlProps['data']['deferredPayments']
}) {
  const total = payments.reduce((acc, payment) => acc + payment.amount, 0)
  return (
    <Page size="A4" style={styles.page}>
      <GlobalHeader year={data.year} cashRegisterId={data.cashRegisterId} />
      <View style={styles.payments}>
        <Text fixed>{title}</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} fixed>
            <View style={styles.tableCol}>
              <Text style={styles.headerCell}>Vente</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.headerCell}>Acheteur</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.headerCell}>Téléphone</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.headerCell}>Ville</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.headerCell}>Montant vente</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.headerCell}>Montant encaissé</Text>
            </View>
          </View>

          {payments.map((payment, index) => {
            const mismatch = payment.amount !== payment.saleTotal
            return (
              <View
                style={[
                  styles.tableRow,
                  ...(mismatch ? [styles.tableRowMismatch] : []),
                ]}
                key={index}
              >
                <View style={styles.tableCol}>
                  <Text>{payment.saleIndex}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{payment.buyerName}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{payment.buyerPhoneNumber}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{payment.buyerCity}</Text>
                </View>
                <View style={styles.tableColPrice}>
                  <Text>
                    <FormattedNumber
                      value={payment.saleTotal}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
                <View style={styles.tableColPrice}>
                  <Text>
                    <FormattedNumber
                      value={payment.amount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
              </View>
            )
          })}
          <View style={styles.tableTotalRow}>
            <View style={styles.tableCol} />
            <View style={styles.tableCol} />
            <View style={styles.tableCol} />
            <View style={styles.tableCol} />
            <View style={styles.tableColPrice}>
              <Text style={styles.totalLabel}>Total</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.totalValue}>
                <FormattedNumber
                  value={total}
                  style="currency"
                  currency="EUR"
                  useGrouping={false}
                />
              </Text>
            </View>
          </View>
        </View>
      </View>
      <PageFooter />
    </Page>
  )
}

function CashPaymentPage({
  data,
  cashPayment,
}: {
  data: SaleCashRegisterControlProps['data']
  cashPayment: SaleCashRegisterControlProps['data']['cashPayment']
}) {
  return (
    <Page size="A4" style={styles.page}>
      <GlobalHeader year={data.year} cashRegisterId={data.cashRegisterId} />
      <View>
        <Text>Paiement espèces</Text>

        <View
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ gap: 8 }}>
            <View style={styles.libelle}>
              <Text>Fond de caisse:</Text>
              <Text>
                <FormattedNumber
                  value={cashPayment.initialAmount}
                  style="currency"
                  currency="EUR"
                  useGrouping={false}
                />
              </Text>
            </View>
            <View style={styles.libelle}>
              <Text>Montant réel:</Text>
              <Text>
                <FormattedNumber
                  value={cashPayment.realAmount}
                  style="currency"
                  currency="EUR"
                  useGrouping={false}
                />
              </Text>
            </View>
            <View style={styles.libelle}>
              <Text>Montant théorique:</Text>
              <Text>
                <FormattedNumber
                  value={cashPayment.theoreticalAmount}
                  style="currency"
                  currency="EUR"
                  useGrouping={false}
                />
              </Text>
            </View>
            <View style={styles.libelle}>
              <Text>Différence:</Text>
              <Text>
                <FormattedNumber
                  value={cashPayment.realAmount - cashPayment.theoreticalAmount}
                  style="currency"
                  currency="EUR"
                  useGrouping={false}
                />
              </Text>
            </View>
          </View>
          <View style={styles.amountList}>
            {cashPayment.amounts.map((amount, index) => {
              return (
                <View
                  style={{
                    width: 170,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid grey',
                  }}
                  key={index}
                >
                  <Text style={{ width: 45, textAlign: 'right' }}>
                    {amount.value < 1 ? amount.value.toFixed(2) : amount.value} €
                  </Text>
                  <Text>: {amount.amount}</Text>
                  <Text>
                    ={' '}
                    <FormattedNumber
                      value={amount.value * amount.amount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </View>
      <PageFooter />
    </Page>
  )
}

function RefundPaymentsPage({
  data,
  payments,
  title,
  comment,
}: {
  data: SaleCashRegisterControlProps['data']
  title: string
  payments: SaleCashRegisterControlProps['data']['refundPayments']
  comment?: string | null
}) {
  const total = payments.reduce((acc, payment) => acc + payment.amount, 0)
  return (
    <Page size="A4" style={styles.page}>
      <GlobalHeader year={data.year} cashRegisterId={data.cashRegisterId} />
      <View style={styles.payments}>
        <Text fixed>{title}</Text>
        <View style={styles.refundTable}>
          <View style={[styles.refundTableRow, styles.refundTableHeader]} fixed>
            <View style={styles.refundTableCol}>
              <Text style={styles.refundHeaderCell}>Vente</Text>
            </View>
            <View style={styles.refundTableCol}>
              <Text style={styles.refundHeaderCell}>Acheteur</Text>
            </View>
            <View style={styles.refundTableCol}>
              <Text style={styles.refundHeaderCell}>Téléphone</Text>
            </View>
            <View style={styles.refundTableCol}>
              <Text style={styles.refundHeaderCell}>Ville</Text>
            </View>
            <View style={styles.refundTableCol}>
              <Text style={styles.refundHeaderCell}>Type</Text>
            </View>
            <View style={styles.refundTableCol}>
              <Text style={styles.refundHeaderCell}>Commentaire</Text>
            </View>
            <View style={styles.refundTableColPrice}>
              <Text style={styles.refundHeaderCell}>Montant vente</Text>
            </View>
            <View style={styles.refundTableColPrice}>
              <Text style={styles.refundHeaderCell}>Montant</Text>
            </View>
          </View>

          {payments.map((payment, index) => (
            <View style={styles.refundTableRow} key={index}>
              <View style={styles.refundTableCol}>
                <Text>{payment.saleIndex}</Text>
              </View>
              <View style={styles.refundTableCol}>
                <Text>{payment.buyerName}</Text>
              </View>
              <View style={styles.refundTableCol}>
                <Text>{payment.buyerPhoneNumber}</Text>
              </View>
              <View style={styles.refundTableCol}>
                <Text>{payment.buyerCity}</Text>
              </View>
              <View style={styles.refundTableCol}>
                <Text>{payment.type}</Text>
              </View>
              <View style={styles.refundTableCol}>
                <Text>{payment.comment}</Text>
              </View>
              <View style={styles.refundTableColPrice}>
                <Text>
                  <FormattedNumber
                    value={payment.saleTotal}
                    style="currency"
                    currency="EUR"
                    useGrouping={false}
                  />
                </Text>
              </View>
              <View style={styles.refundTableColPrice}>
                <Text>
                  <FormattedNumber
                    value={payment.amount}
                    style="currency"
                    currency="EUR"
                    useGrouping={false}
                  />
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.tableTotalRow}>
            <View style={styles.refundTableCol} />
            <View style={styles.refundTableCol} />
            <View style={styles.refundTableCol} />
            <View style={styles.refundTableCol} />
            <View style={styles.refundTableCol} />
            <View style={styles.refundTableCol} />
            <View style={styles.refundTableColPrice}>
              <Text style={styles.totalLabel}>Total</Text>
            </View>
            <View style={styles.refundTableColPrice}>
              <Text style={styles.totalValue}>
                <FormattedNumber
                  value={total}
                  style="currency"
                  currency="EUR"
                  useGrouping={false}
                />
              </Text>
            </View>
          </View>
        </View>
      </View>
      <PdfCommentSection comment={comment} />
      <PageFooter />
    </Page>
  )
}
