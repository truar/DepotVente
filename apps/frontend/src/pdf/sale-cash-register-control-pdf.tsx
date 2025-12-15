import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { FormattedNumber, IntlProvider } from 'react-intl'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'

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
    width: '20%',
  },
  tableColPrice: {
    textAlign: 'right',
    width: '20%',
    paddingRight: 10,
  },
  headerCell: {
    fontStyle: 'italic',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
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
    width: '15%',
  },
  refundTableColPrice: {
    textAlign: 'right',
    width: '10%',
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
    }>
    checkPayments: Array<{
      saleIndex: number
      buyerName: string
      buyerPhoneNumber: string
      buyerCity: string
      amount: number
    }>
    refundPayments: Array<{
      saleIndex: number
      buyerName: string
      buyerPhoneNumber: string
      buyerCity: string
      type: 'CB' | 'CASH'
      comment: string
      amount: number
    }>
    cashPayment: {
      initialAmount: number
      realAmount: number
      theoreticalAmount: number
      amounts: Array<{ value: number; amount: number }>
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
        {Array.from({ length: copy }).map((_, index) => (
          <Page size="A4" style={styles.page} key={`page-${index}`}>
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                <CMRLogo />
                <View style={styles.title}>
                  <Text>Bourse au skis {data.year}</Text>
                  <Text>Club Montagnard Rumillien</Text>
                  <Text>Règlements des ventes</Text>
                </View>
              </View>
              <View>
                <View>
                  <Text>N° {data.cashRegisterId}</Text>
                </View>
              </View>
            </View>
            <Payments
              title="Paiement CB"
              payments={data.cardPayments}
              shouldBreak={false}
            />
            <CashPayment cashPayment={cashPayment} shouldBreak={true} />
            <Payments
              title="Paiement Chèques"
              payments={data.checkPayments}
              shouldBreak={true}
            />
            <RefundPayments
              title="Remboursements"
              payments={data.refundPayments}
              shouldBreak={true}
            />
            <View fixed style={styles.pageInformation}>
              <Text
                render={({ subPageNumber, subPageTotalPages }) =>
                  `Page ${subPageNumber} sur ${subPageTotalPages}`
                }
              />
            </View>
          </Page>
        ))}
      </Document>
    </IntlProvider>
  )
}

function Payments({
  payments,
  title,
  shouldBreak,
}: {
  shouldBreak?: boolean
  title: string
  payments:
    | SaleCashRegisterControlProps['data']['cardPayments']
    | SaleCashRegisterControlProps['data']['checkPayments']
}) {
  return (
    <>
      {payments.length > 0 && (
        <View style={styles.payments} break={shouldBreak}>
          <Text>{title}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
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
                <Text style={styles.headerCell}>Montant</Text>
              </View>
            </View>

            {payments.map((payment, index) => (
              <View style={styles.tableRow} key={index}>
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
                      value={payment.amount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  )
}

function CashPayment({
  cashPayment,
  shouldBreak,
}: {
  shouldBreak: boolean
  cashPayment: SaleCashRegisterControlProps['data']['cashPayment']
}) {
  return (
    <View break={shouldBreak}>
      <Text>Paiement espèces</Text>

      <View
        style={{
          marginTop: 10,
          display: 'flex',
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={styles.libelle}>
            Fond de caisse:{' '}
            <FormattedNumber
              value={cashPayment.initialAmount}
              style="currency"
              currency="EUR"
              useGrouping={false}
            />
          </Text>
          <Text style={styles.libelle}>
            Montant réel:{' '}
            <FormattedNumber
              value={cashPayment.realAmount}
              style="currency"
              currency="EUR"
              useGrouping={false}
            />
          </Text>
          <Text style={styles.libelle}>
            Montant théorique:{' '}
            <FormattedNumber
              value={cashPayment.theoreticalAmount}
              style="currency"
              currency="EUR"
              useGrouping={false}
            />
          </Text>
          <Text style={styles.libelle}>
            Différence:{' '}
            <FormattedNumber
              value={cashPayment.realAmount - cashPayment.theoreticalAmount}
              style="currency"
              currency="EUR"
              useGrouping={false}
            />
          </Text>
        </View>
        <View style={styles.amountList}>
          {cashPayment.amounts.map((amount, index) => {
            return (
              <View
                style={{
                  width: 100,
                  display: 'flex',
                  flexDirection: 'row',
                  borderBottom: '1px solid grey',
                }}
                key={index}
              >
                <Text style={{ width: 50, textAlign: 'right' }}>
                  {amount.value}€{' '}
                </Text>
                <Text>: {amount.amount}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

function RefundPayments({
  payments,
  title,
  shouldBreak,
}: {
  shouldBreak?: boolean
  title: string
  payments: SaleCashRegisterControlProps['data']['refundPayments']
}) {
  return (
    <>
      {payments.length > 0 && (
        <View style={styles.payments} break={shouldBreak}>
          <Text>{title}</Text>
          <View style={styles.refundTable}>
            <View style={[styles.refundTableRow, styles.refundTableHeader]}>
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
                      value={payment.amount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  )
}
