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
  tableColSmall: {
    width: '7%',
  },
  tableCol: {
    width: '17%',
  },
  tableColPrice: {
    textAlign: 'right',
    width: '10%',
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

export type CheckListingProps = {
  copy?: number
  data: {
    checks: Array<{
      index: number
      seller: string
      sellerAmount?: number
      checkId?: string
      collectedAt?: string
      collectWorkstationId?: number
      signatory?: string
    }>
    year: number
  }
}

export const CheckListingPdf = (props: CheckListingProps) => {
  const { data, copy = 1 } = props
  const { checks } = data
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
                  <Text>Liste des chèques</Text>
                </View>
              </View>
            </View>
            <View style={styles.payments}>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={styles.tableColSmall}>
                    <Text style={styles.headerCell}>N° fiche</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.headerCell}>Nom</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.headerCell}>Poste retour</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.headerCell}>N° chèque</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.headerCell}>Heure retour</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.headerCell}>Signature</Text>
                  </View>
                  <View style={styles.tableColPrice}>
                    <Text style={styles.headerCell}>Règlement</Text>
                  </View>
                </View>

                {checks.map((check, index) => (
                  <View style={styles.tableRow} key={index}>
                    <View style={styles.tableColSmall}>
                      <Text>{check.index}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{check.seller}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{check.collectWorkstationId}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{check.checkId}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{check.collectedAt}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text>{check.signatory}</Text>
                    </View>
                    <View style={styles.tableColPrice}>
                      <Text>
                        <FormattedNumber
                          value={check.sellerAmount ?? 0}
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
