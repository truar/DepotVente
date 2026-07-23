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
  headerCell: {
    fontStyle: 'italic',
  },
  totalLabel: {
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  cashBody: {
    flexDirection: 'row',
    gap: 20,
  },
  cashColumn: {
    flexDirection: 'column',
    gap: 5,
  },
  cashSubTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cashTable: {
    width: 240,
    fontSize: 9,
  },
  cashHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#f3f4f6',
  },
  cashRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  cashTotalRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#e5e7eb',
  },
  cashColCoupure: {
    width: '35%',
    textAlign: 'right',
    paddingRight: 8,
  },
  cashColNombre: {
    width: '25%',
    textAlign: 'center',
  },
  cashColTotal: {
    width: '40%',
    textAlign: 'right',
  },
  cashSummaryBox: {
    width: 250,
    fontSize: 11,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  cashSummaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cashSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cashSummaryValue: {
    fontWeight: 'bold',
  },
  cashSummaryDivider: {
    borderTopWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 2,
    marginBottom: 2,
  },
  pageInformation: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    fontSize: 8,
  },
})

export type DepositCashRegisterControlProps = {
  copy?: number
  data: {
    year: number
    cashRegisterId: number
    initialAmount: number
    realAmount: number
    theoreticalAmount: number
    amounts: Array<{ value: number; amount: number }>
    comment?: string | null
  }
}

export const DepositCashRegisterControlPdf = (
  props: DepositCashRegisterControlProps,
) => {
  const { data, copy = 1 } = props
  const totalCounted = data.amounts.reduce(
    (acc, amount) => acc + amount.value * amount.amount,
    0,
  )
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
                  <Text>Contrôle caisse dépôts</Text>
                </View>
              </View>
              <View>
                <View>
                  <Text>Caisse N° {data.cashRegisterId}</Text>
                </View>
              </View>
            </View>
            <View style={styles.cashBody}>
              <View style={styles.cashColumn}>
                <Text style={styles.cashSubTitle}>Décompte des espèces</Text>
                <View style={styles.cashTable}>
                  <View style={styles.cashHeaderRow}>
                    <View style={styles.cashColCoupure}>
                      <Text style={styles.headerCell}>Coupure</Text>
                    </View>
                    <View style={styles.cashColNombre}>
                      <Text style={styles.headerCell}>Nombre</Text>
                    </View>
                    <View style={styles.cashColTotal}>
                      <Text style={styles.headerCell}>Total</Text>
                    </View>
                  </View>
                  {data.amounts.map((amount, index) => (
                    <View style={styles.cashRow} key={index}>
                      <View style={styles.cashColCoupure}>
                        <Text>
                          {amount.value < 1
                            ? amount.value.toFixed(2)
                            : amount.value}{' '}
                          €
                        </Text>
                      </View>
                      <View style={styles.cashColNombre}>
                        <Text>{amount.amount}</Text>
                      </View>
                      <View style={styles.cashColTotal}>
                        <Text>
                          <FormattedNumber
                            value={amount.value * amount.amount}
                            style="currency"
                            currency="EUR"
                            useGrouping={false}
                          />
                        </Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.cashTotalRow}>
                    <View style={styles.cashColCoupure}>
                      <Text style={styles.totalLabel}>Total</Text>
                    </View>
                    <View style={styles.cashColNombre} />
                    <View style={styles.cashColTotal}>
                      <Text style={styles.totalValue}>
                        <FormattedNumber
                          value={totalCounted}
                          style="currency"
                          currency="EUR"
                          useGrouping={false}
                        />
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.cashSummaryBox}>
                <Text style={styles.cashSummaryTitle}>Récapitulatif</Text>
                <View style={styles.cashSummaryRow}>
                  <Text>Fond de caisse</Text>
                  <Text style={styles.cashSummaryValue}>
                    <FormattedNumber
                      value={data.initialAmount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
                <View style={styles.cashSummaryRow}>
                  <Text>Montant réel</Text>
                  <Text style={styles.cashSummaryValue}>
                    <FormattedNumber
                      value={data.realAmount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
                <View style={styles.cashSummaryRow}>
                  <Text>Montant théorique</Text>
                  <Text style={styles.cashSummaryValue}>
                    <FormattedNumber
                      value={data.theoreticalAmount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
                <View style={styles.cashSummaryDivider} />
                <View style={styles.cashSummaryRow}>
                  <Text>Différence</Text>
                  <Text style={styles.cashSummaryValue}>
                    <FormattedNumber
                      value={data.realAmount - data.theoreticalAmount}
                      style="currency"
                      currency="EUR"
                      useGrouping={false}
                    />
                  </Text>
                </View>
              </View>
            </View>
            <PdfCommentSection comment={data.comment} />
            <View fixed style={styles.pageInformation}>
              <Text
                render={({ subPageNumber, subPageTotalPages }) =>
                  `Page ${subPageNumber} sur ${subPageTotalPages}`
                }
              />
            </View>
            <PdfTimestampFooter />
          </Page>
        ))}
      </Document>
    </IntlProvider>
  )
}
