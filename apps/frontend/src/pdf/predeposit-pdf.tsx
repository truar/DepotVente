import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { FormattedNumber, IntlProvider } from 'react-intl'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'

// Create styles
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
  contact: {
    fontSize: 10,
    flexDirection: 'column',
    gap: 5,
  },
  contactLine: {
    flexDirection: 'row',
    gap: 5,
  },
  contactLineHeader: {
    width: 90,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  name: {
    fontWeight: 'bold',
  },
  articles: {
    flexDirection: 'column',
    gap: 5,
  },
  articlesHeader: {
    fontSize: 10,
    flexDirection: 'row',
  },
  articleCount: {
    fontWeight: 'bold',
  },
  table: {
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
    width: '11%',
  },
  tableColPrice: {
    textAlign: 'right',
    width: '9%',
    paddingRight: 10,
  },
  tableColDesc: {
    width: '25%',
  },
  headerCell: {
    fontStyle: 'italic',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
})

export type Article = {
  shortCode: string
  brand: string
  model: string
  size: string
  price: number
  discipline: string
  color: string
  category: string
}

export type PdfProps = {
  copy?: number
  data: PdfData
}

export const PredepositPdf = (props: PdfProps) => {
  const { data, copy = 1 } = props
  return <PredepositsPdf copy={copy} data={[data]} />
}

type PdfData = {
  deposit: {
    depositIndex: number
    year: number
  }
  articles?: Article[]
  contact: {
    lastName: string
    firstName: string
    phoneNumber: string
    city?: string | null
  }
}

export type PdfsProps = {
  copy?: number
  data: Array<PdfData>
}

export const PredepositsPdf = (props: PdfsProps) => {
  const { data: deposits, copy = 1 } = props
  const depositPages = deposits.map((data) => {
    const { articles = [] } = data
    return Array.from({ length: copy }).map((_, index) => (
      <Page key={`page-${index}`} size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <CMRLogo />
            <View style={styles.title}>
              <Text>Bourse au skis {data.deposit.year}</Text>
              <Text>Club Montagnard Rumillien</Text>
              <Text>Pré-Dépôt</Text>
            </View>
          </View>
          <View>
            <View>
              <Text>Fiche N° {data.deposit.depositIndex}</Text>
            </View>
          </View>
        </View>
        <View style={styles.subHeader}>
          <View style={styles.contact}>
            <View style={styles.contactLine}>
              <Text style={styles.contactLineHeader}>Nom, Prénom :</Text>
              <Text style={styles.name}>
                {data.contact.lastName.toUpperCase()} {data.contact.firstName}
              </Text>
            </View>
            <View style={styles.contactLine}>
              <Text style={styles.contactLineHeader}>Adresse :</Text>
              <Text>{data.contact.city}</Text>
            </View>
            <View style={styles.contactLine}>
              <Text style={styles.contactLineHeader}>Téléphone :</Text>
              <Text>{data.contact.phoneNumber}</Text>
            </View>
            <View style={styles.contactLine}>
              <Text style={styles.contactLineHeader}>Nb articles :</Text>
              <Text style={styles.articleCount}>{articles.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.articles}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol}>
                <Text style={styles.headerCell}>Identifiant</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.headerCell}>Discipline</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.headerCell}>Catégorie</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.headerCell}>Marque</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.headerCell}>Couleur</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.headerCell}>Taille</Text>
              </View>
              <View style={styles.tableColDesc}>
                <Text style={styles.headerCell}>Descriptif</Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.headerCell}>Prix</Text>
              </View>
            </View>

            {articles.map((article, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text>{article.shortCode}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{article.discipline}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{article.category}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{article.brand}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{article.color}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text>{article.size}</Text>
                </View>
                <View style={styles.tableColDesc}>
                  <Text>{article.model}</Text>
                </View>
                <View style={styles.tableColPrice}>
                  <Text>
                    <FormattedNumber
                      value={article.price}
                      style="currency"
                      currency="EUR"
                    />
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View
          fixed
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            fontSize: 8,
          }}
        >
          <Text
            render={({ subPageNumber, subPageTotalPages }) =>
              `Page ${subPageNumber} sur ${subPageTotalPages}`
            }
          />
        </View>
      </Page>
    ))
  })
  return (
    <IntlProvider locale={'fr'}>
      <Document>{depositPages}</Document>
    </IntlProvider>
  )
}
