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
  }
}

export const DepositCashRegisterControlPdf = (
  props: DepositCashRegisterControlProps,
) => {
  const { data, copy = 1 } = props
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
                </View>
              </View>
              <View>
                <View>
                  <Text>Caisse N° {data.cashRegisterId}</Text>
                </View>
              </View>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={styles.libelle}>
                  Fond de caisse:{' '}
                  <FormattedNumber
                    value={data.initialAmount}
                    style="currency"
                    currency="EUR"
                  />
                </Text>
                <Text style={styles.libelle}>
                  Montant réel:{' '}
                  <FormattedNumber
                    value={data.realAmount}
                    style="currency"
                    currency="EUR"
                  />
                </Text>
                <Text style={styles.libelle}>
                  Montant théorique:{' '}
                  <FormattedNumber
                    value={data.theoreticalAmount}
                    style="currency"
                    currency="EUR"
                  />
                </Text>
                <Text style={styles.libelle}>
                  Différence:{' '}
                  <FormattedNumber
                    value={data.realAmount - data.theoreticalAmount}
                    style="currency"
                    currency="EUR"
                  />
                </Text>
              </View>
              <View style={styles.amountList}>
                {data.amounts.map((amount, index) => {
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
