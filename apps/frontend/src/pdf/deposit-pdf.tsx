import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'

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
  title: {
    gap: 5,
  },
  contact: {
    fontSize: 12,
    flexDirection: 'column',
    gap: 5,
  },
  contactLine: {
    flexDirection: 'row',
    gap: 5,
  },
  contactLineHeader: {
    width: 80,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  name: {
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
  tableColDesc: {
    width: '23%',
  },
  headerCell: {
    fontStyle: 'italic',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
})

export type Article = {
  index: string
  brand: string
  model: string
  size: string
  price: number
  discipline: string
  color: string
  category: string
}

export type DepositPdfProps = {
  copy?: number
  data: {
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
}

// Create Document Component
export const DepositPdf = (props: DepositPdfProps) => {
  const { data } = props
  const { articles = [] } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.title}>
            <Text>Bourse au skis {data.deposit.year}</Text>
            <Text>Club Montagnard Rumillien</Text>
          </View>
          <View>
            <Text>Fiche de dépôt N° {data.deposit.depositIndex}</Text>
          </View>
        </View>
        <View style={styles.contact}>
          <View style={styles.contactLine}>
            <Text style={styles.contactLineHeader}>Nom, Prénom :</Text>
            <Text style={styles.name}>
              {data.contact.lastName} {data.contact.firstName}
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
        </View>

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
            <View style={styles.tableCol}>
              <Text style={styles.headerCell}>Prix</Text>
            </View>
          </View>

          {articles.map((article, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text>{article.index}</Text>
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
              <View style={styles.tableCol}>
                <Text>{article.price}€</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
