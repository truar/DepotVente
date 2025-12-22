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

export type DepositsMissingContributionProps = {
  data: {
    deposits: Array<{
      depositIndex: number
      seller: string
      contributionAmount: number
      withReturn: boolean
    }>
    year: number
  }
}

export const DepositsMissingContributionPdf = (
  props: DepositsMissingContributionProps,
) => {
  const { data } = props
  const { deposits } = data
  const depositsWithReturn = deposits.filter((deposit) => !!deposit.withReturn)
  return (
    <IntlProvider locale={'fr'}>
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <CMRLogo />
              <View style={styles.title}>
                <Text>Bourse au skis {data.year}</Text>
                <Text>Club Montagnard Rumillien</Text>
                <Text>
                  Liste des cotisations à encaisser sans récupération de chèques
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.payments}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={styles.tableCol}>
                  <Text style={styles.headerCell}>N° fiche</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.headerCell}>Nom</Text>
                </View>
                <View style={styles.tableColPrice}>
                  <Text style={styles.headerCell}>Montant</Text>
                </View>
              </View>

              {deposits
                .filter((deposit) => !deposit.withReturn)
                .map((deposit, index) => (
                  <View style={styles.tableRow} key={index}>
                    <View style={styles.tableCol}>
                      <Text>{deposit.depositIndex}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{deposit.seller}</Text>
                    </View>
                    <View style={styles.tableColPrice}>
                      <Text>
                        <FormattedNumber
                          value={deposit.contributionAmount}
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

          {depositsWithReturn && (
            <View style={styles.payments}>
              <View style={{ textAlign: 'center' }}>
                <Text>
                  Liste des cotisations à encaisser avec une récupération de
                  chèque
                </Text>
              </View>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={styles.tableCol}>
                    <Text style={styles.headerCell}>N° fiche</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.headerCell}>Nom</Text>
                  </View>
                  <View style={styles.tableColPrice}>
                    <Text style={styles.headerCell}>Montant</Text>
                  </View>
                </View>

                {depositsWithReturn.map((deposit, index) => (
                  <View style={styles.tableRow} key={index}>
                    <View style={styles.tableCol}>
                      <Text>{deposit.depositIndex}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{deposit.seller}</Text>
                    </View>
                    <View style={styles.tableColPrice}>
                      <Text>
                        <FormattedNumber
                          value={deposit.contributionAmount}
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
          <View fixed style={styles.pageInformation}>
            <Text
              render={({ subPageNumber, subPageTotalPages }) =>
                `Page ${subPageNumber} sur ${subPageTotalPages}`
              }
            />
          </View>
        </Page>
      </Document>
    </IntlProvider>
  )
}
