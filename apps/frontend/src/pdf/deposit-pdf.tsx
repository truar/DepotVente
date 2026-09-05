import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { Fragment } from 'react'
import { FormattedNumber, IntlProvider } from 'react-intl'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'

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
  tableColNarrow: {
    width: '9.5%',
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
  repeatedHeader: {
    position: 'absolute',
    top: 15,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    fontStyle: 'italic',
  },
  tableRowDeleted: {
    backgroundColor: '#f3f4f6',
  },
  deletedCell: {
    color: '#9ca3af',
    textDecoration: 'line-through',
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 2,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderColor: 'grey',
    backgroundColor: '#c3c8d0',
    fontStyle: 'italic',
    fontWeight: 'bold',
    justifyContent: 'space-between',
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
  serialNumber?: string
  isDeleted?: boolean
}

export type DepositPdfProps = {
  copy?: number
  data: DepositPdfData
  showCategorySubtotals?: boolean
  showSerialNumber?: boolean
}

export const DepositPdf = (props: DepositPdfProps) => {
  const { data, copy = 1, showCategorySubtotals, showSerialNumber } = props
  return (
    <DepositsPdf
      copy={copy}
      data={[data]}
      showCategorySubtotals={showCategorySubtotals}
      showSerialNumber={showSerialNumber}
    />
  )
}

type DepositPdfData = {
  deposit: {
    depositIndex: number
    year: number
    contributionAmount: number
    contributionStatus: string
  }
  articles?: Article[]
  contact: {
    lastName: string
    firstName: string
    phoneNumber: string
    city?: string | null
  }
}

export type DepositsPdfProps = {
  copy?: number
  data: Array<DepositPdfData>
  showCategorySubtotals?: boolean
  showSerialNumber?: boolean
}

export const DepositsPdf = (props: DepositsPdfProps) => {
  const {
    data: deposits,
    copy = 1,
    showCategorySubtotals = false,
    showSerialNumber = false,
  } = props
  const colStyle = showSerialNumber ? styles.tableColNarrow : styles.tableCol
  const depositPages = deposits.map((data) => {
    const {
      articles = [],
      deposit: { contributionStatus },
    } = data
    let contribution = null
    if (contributionStatus === 'A_PAYER') {
      contribution = (
        <>
          <FormattedNumber
            value={data.deposit.contributionAmount}
            style="currency"
            currency="EUR"
            useGrouping={false}
          />{' '}
          (A Payer)
        </>
      )
    } else if (contributionStatus === 'PAYE') {
      contribution = (
        <>
          <FormattedNumber
            value={data.deposit.contributionAmount}
            style="currency"
            currency="EUR"
            useGrouping={false}
          />{' '}
          (Payé)
        </>
      )
    } else if (contributionStatus === 'SOLDE') {
      contribution = (
        <>
          <FormattedNumber
            value={data.deposit.contributionAmount}
            style="currency"
            currency="EUR"
            useGrouping={false}
          />{' '}
          (Soldée)
        </>
      )
    } else if (contributionStatus === 'DEDUITE') {
      contribution = (
        <>
          <FormattedNumber
            value={data.deposit.contributionAmount}
            style="currency"
            currency="EUR"
            useGrouping={false}
          />{' '}
          (Déduite)
        </>
      )
    } else if (contributionStatus === 'PRO') {
      contribution = <>Pro</>
    } else {
      contribution = <>Gratuit</>
    }
    return Array.from({ length: copy }).map((_, index) => (
      <Page key={`page-${index}`} size="A4" style={styles.page}>
        <View
          fixed
          style={styles.repeatedHeader}
          render={({ subPageNumber }) =>
            subPageNumber > 1 ? (
              <>
                <Text style={styles.name}>
                  {data.contact.lastName.toUpperCase()}{' '}
                  {data.contact.firstName}
                </Text>
                <Text>Fiche N° {data.deposit.depositIndex}</Text>
              </>
            ) : null
          }
        />
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <CMRLogo />
            <View style={styles.title}>
              <Text>Bourse au skis {data.deposit.year}</Text>
              <Text>Club Montagnard Rumillien</Text>
              <Text>Dépôt</Text>
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
              <Text style={styles.articleCount}>
                {articles.filter((a) => !a.isDeleted).length}
              </Text>
            </View>
            <View style={styles.contactLine}>
              <Text style={styles.contactLineHeader}>Cotisations :</Text>
              <Text style={styles.articleCount}>{contribution}</Text>
            </View>
          </View>
          <View style={styles.globalInformation}>
            <View style={styles.pickupInformation}>
              <Text>Matériel à récupérer samedi soir entre 18h30 et 20h30</Text>
            </View>
            <View style={styles.information}>
              <Text>Information:</Text>
              <Text>
                Assembléé générale le vendredi 14 novembre 2025 à 20h au Centre
                de loisirs du Bouchet
              </Text>
              <Text>
                1ère permanence pour la vente des licences carte-neige: vendredi
                28 novembre 2025 à 19h au gymnase de l'Albanais
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.articles}>
          <View style={styles.table}>
            <View fixed style={[styles.tableRow, styles.tableHeader]}>
              <View style={colStyle}>
                <Text style={styles.headerCell}>Identifiant</Text>
              </View>
              <View style={colStyle}>
                <Text style={styles.headerCell}>Catégorie</Text>
              </View>
              <View style={colStyle}>
                <Text style={styles.headerCell}>Marque</Text>
              </View>
              <View style={colStyle}>
                <Text style={styles.headerCell}>Discipline</Text>
              </View>
              {showSerialNumber && (
                <View style={colStyle}>
                  <Text style={styles.headerCell}>N° Série</Text>
                </View>
              )}
              <View style={colStyle}>
                <Text style={styles.headerCell}>Couleur</Text>
              </View>
              <View style={colStyle}>
                <Text style={styles.headerCell}>Taille</Text>
              </View>
              <View style={styles.tableColDesc}>
                <Text style={styles.headerCell}>Descriptif</Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.headerCell}>Prix</Text>
              </View>
            </View>

            {articles.map((article, index) => {
              const cellStyle = article.isDeleted ? styles.deletedCell : undefined
              const rowStyle = article.isDeleted
                ? [styles.tableRow, styles.tableRowDeleted]
                : styles.tableRow
              const isLastOfCategory =
                showCategorySubtotals &&
                articles[index + 1]?.category !== article.category
              return (
                <Fragment key={index}>
                  <View style={rowStyle}>
                    <View style={colStyle}>
                      <Text style={cellStyle}>{article.shortCode}</Text>
                    </View>
                    <View style={colStyle}>
                      <Text style={cellStyle}>{article.category}</Text>
                    </View>
                    <View style={colStyle}>
                      <Text style={cellStyle}>{article.brand}</Text>
                    </View>
                    <View style={colStyle}>
                      <Text style={cellStyle}>{article.discipline}</Text>
                    </View>
                    {showSerialNumber && (
                      <View style={colStyle}>
                        <Text style={cellStyle}>{article.serialNumber}</Text>
                      </View>
                    )}
                    <View style={colStyle}>
                      <Text style={cellStyle}>{article.color}</Text>
                    </View>
                    <View style={colStyle}>
                      <Text style={cellStyle}>{article.size}</Text>
                    </View>
                    <View style={styles.tableColDesc}>
                      <Text style={cellStyle}>{article.model}</Text>
                    </View>
                    <View style={styles.tableColPrice}>
                      <Text style={cellStyle}>
                        <FormattedNumber
                          value={article.price}
                          style="currency"
                          currency="EUR"
                          useGrouping={false}
                        />
                      </Text>
                    </View>
                  </View>
                  {isLastOfCategory && (
                    <CategorySubtotalRow
                      category={article.category}
                      articles={articles}
                    />
                  )}
                </Fragment>
              )
            })}
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
        <PdfTimestampFooter />
      </Page>
    ))
  })
  return (
    <IntlProvider locale={'fr'}>
      <Document>{depositPages}</Document>
    </IntlProvider>
  )
}

function CategorySubtotalRow(props: {
  category: string
  articles: Article[]
}) {
  const { category, articles } = props
  const inCategory = articles.filter(
    (a) => a.category === category && !a.isDeleted,
  )
  const total = inCategory.reduce((sum, a) => sum + a.price, 0)
  return (
    <View style={styles.subtotalRow}>
      <Text>
        Sous-total {category} : {inCategory.length} article
        {inCategory.length > 1 ? 's' : ''}
      </Text>
      <Text>
        <FormattedNumber
          value={total}
          style="currency"
          currency="EUR"
          useGrouping={false}
        />
      </Text>
    </View>
  )
}
