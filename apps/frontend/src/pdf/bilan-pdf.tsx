import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'
import { pdfDec, pdfEur, pdfPct } from '@/pdf/format.ts'

const timestampFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'short',
  timeStyle: 'medium',
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
    fontSize: 11,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    gap: 2,
  },
  headerDate: {
    fontSize: 9,
    color: '#4b5563',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    marginBottom: 2,
  },
  columns: {
    flexDirection: 'row',
    gap: 24,
  },
  column: {
    flex: 1,
    gap: 5,
  },
  row: {
    flexDirection: 'row',
  },
  // Label on the left, amount pushed to the right edge of the column so that
  // stacked amounts share a common right edge and read as a column.
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: '#111827',
    flexShrink: 1,
  },
  value: {
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  highlight: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    textDecoration: 'underline',
    marginTop: 4,
  },
  indent: {
    paddingLeft: 16,
  },
  // Compact "label : amount" line: the amount sits right after the label (used
  // for the standalone rows that are not inside the two-column blocks, so they
  // don't stretch across the full page width).
  compactRow: {
    flexDirection: 'row',
    gap: 4,
  },
  valueCompact: {
    fontFamily: 'Helvetica-Bold',
  },
})

const Amount = ({ value }: { value: number }) => <>{pdfEur(value)}</>

const Percent = ({ value }: { value: number }) => <>{pdfPct(value)}</>

/**
 * A "Label : value" line where the value is rendered bold.
 * - default: the value is pushed to the column's right edge (amounts stack).
 * - compact: the value sits right after the label (for standalone rows that
 *   would otherwise stretch across the full page width).
 */
function Line({
  label,
  children,
  indent = false,
  compact = false,
}: {
  label: string
  children: ReactNode
  indent?: boolean
  compact?: boolean
}) {
  return (
    <View
      style={[
        compact ? styles.compactRow : styles.lineRow,
        ...(indent ? [styles.indent] : []),
      ]}
    >
      <Text style={styles.label}>{label} :</Text>
      <Text style={compact ? styles.valueCompact : styles.value}>
        {children}
      </Text>
    </View>
  )
}

export type BilanPdfData = {
  year: number
  deposits: {
    /** Nombre de fiches de dépôt */
    fichesCount: number
    /** Dont issues d'un pré-dépôt */
    predepositsCount: number
    /** Nombre d'articles en dépôt */
    articlesCount: number
    /** Montant total du dépôt (somme des prix des articles) */
    totalAmount: number
  }
  sales: {
    /** Nombre d'acheteurs distincts */
    buyersCount: number
    /** Panier moyen en euros */
    averageBasketAmount: number
    /** Panier moyen en nombre d'articles */
    averageBasketArticles: number
    /** Nombre d'articles vendus */
    soldArticlesCount: number
    /** Part des articles vendus sur les articles en dépôt (0..1) */
    soldArticlesRatio: number
    /** Montant total des ventes */
    totalAmount: number
    /** Part du montant vendu sur la valeur du dépôt (0..1) */
    depositValueRatio: number
  }
  rights: {
    /** Montant des cotisations payées */
    paidContributions: number
    /** Montant des cotisations non payées */
    unpaidContributions: number
    /** Montant des droits CMR */
    cmrRights: number
    /** Montant des achats CMR */
    cmrPurchases: number
    /** Recette bourse théorique */
    theoreticalRevenue: number
  }
  collection: {
    /** Montant total vendu */
    totalSold: number
    /** Montant total décaissé */
    totalDisbursed: number
    totalChecks: number
    totalCash: number
    totalCards: number
    /** Total des paiements (chèques + espèces + cartes) */
    totalPayments: number
    /** Différence vendu - encaissé */
    soldMinusCollected: number
    /** Règlements pros */
    proPayments: number
    /** Règlements particuliers */
    individualPayments: number
    /** Cotisations encaissées */
    collectedContributions: number
    /** Cotisations à encaisser */
    contributionsToCollect: number
    /** Chèques particuliers non faits */
    unmadeIndividualChecks: number
    /** Recette bourse (réelle) */
    actualRevenue: number
    /** Différence recette théorique et réelle */
    theoreticalVsActualDiff: number
    /** Différence de caisses */
    cashRegisterDiff: number
    /** Solde différence */
    diffBalance: number
  }
}

export type BilanPdfProps = {
  data: BilanPdfData
}

export const BilanPdf = ({ data }: BilanPdfProps) => {
  const { deposits, sales, rights, collection } = data
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <CMRLogo />
            <View style={styles.headerTitle}>
              <Text>Bourse aux skis</Text>
              <Text>{data.year}</Text>
              <Text>Bilan de la bourse</Text>
            </View>
          </View>
          <Text style={styles.headerDate}>
            {timestampFormatter.format(new Date())}
          </Text>
        </View>

        {/* Dépôts / pré-dépôts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dépôts/pré-dépôts :</Text>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Line label="Nombre de fiches">{deposits.fichesCount}</Line>
              <Line label="Nombre d'articles en dépôt">
                {deposits.articlesCount}
              </Line>
              <Line label="Montant du dépôt">
                <Amount value={deposits.totalAmount} />
              </Line>
            </View>
            <View style={styles.column}>
              <Line label="Dont pré-dépôts">{deposits.predepositsCount}</Line>
            </View>
          </View>
        </View>

        {/* Ventes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ventes :</Text>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Line label="Nombre d'acheteurs">{sales.buyersCount}</Line>
              <Line label="Nombre d'articles vendus">
                {sales.soldArticlesCount}
              </Line>
              <Line label="Montant total des ventes">
                <Amount value={sales.totalAmount} />
              </Line>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Panier moyen : </Text>
                <Text style={styles.value}>
                  <Amount value={sales.averageBasketAmount} />
                </Text>
                <Text style={styles.label}> et </Text>
                <Text style={styles.value}>
                  {pdfDec(sales.averageBasketArticles)}
                </Text>
                <Text style={styles.label}> articles</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Soit </Text>
                <Text style={styles.value}>
                  <Percent value={sales.soldArticlesRatio} />
                </Text>
                <Text style={styles.label}> des articles en dépôt</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Soit </Text>
                <Text style={styles.value}>
                  <Percent value={sales.depositValueRatio} />
                </Text>
                <Text style={styles.label}> de la valeur du dépôt</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cotisations et droits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cotisations et droits :</Text>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Line label="Montant cotisations payées">
                <Amount value={rights.paidContributions} />
              </Line>
              <Line label="Montant cotisations non payées">
                <Amount value={rights.unpaidContributions} />
              </Line>
            </View>
            <View style={styles.column}>
              <Line label="Montant droits CMR">
                <Amount value={rights.cmrRights} />
              </Line>
              <Line label="Montant achats CMR">
                <Amount value={rights.cmrPurchases} />
              </Line>
            </View>
          </View>
          <View style={styles.compactRow}>
            <Text style={styles.highlight}>Recette bourse théorique :</Text>
            <Text style={styles.highlight}>
              <Amount value={rights.theoreticalRevenue} />
            </Text>
          </View>
        </View>

        {/* Détail des encaissements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des encaissements :</Text>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Line label="Montant total vendu">
                <Amount value={collection.totalSold} />
              </Line>
              <Line label="Total chèques" indent>
                <Amount value={collection.totalChecks} />
              </Line>
              <Line label="Total espèces" indent>
                <Amount value={collection.totalCash} />
              </Line>
              <Line label="Total cartes" indent>
                <Amount value={collection.totalCards} />
              </Line>
              <Line label="Total paiements" indent>
                <Amount value={collection.totalPayments} />
              </Line>
              <Line label="Diff vendu - encaissé" indent>
                <Amount value={collection.soldMinusCollected} />
              </Line>
            </View>
            <View style={styles.column}>
              <Line label="Montant total décaissé">
                <Amount value={collection.totalDisbursed} />
              </Line>
              <Line label="Règlements pros" indent>
                <Amount value={collection.proPayments} />
              </Line>
              <Line label="Règlements particuliers" indent>
                <Amount value={collection.individualPayments} />
              </Line>
            </View>
          </View>

          <View style={{ gap: 5, marginTop: 6 }}>
            <Line label="Cotisations encaissées" compact>
              <Amount value={collection.collectedContributions} />
            </Line>
            <Line label="Cotisations à encaisser" compact>
              <Amount value={collection.contributionsToCollect} />
            </Line>
            <Line label="Chèques particuliers non faits" compact>
              <Amount value={collection.unmadeIndividualChecks} />
            </Line>
          </View>

          <View style={styles.compactRow}>
            <Text style={styles.highlight}>Recette bourse :</Text>
            <Text style={styles.highlight}>
              <Amount value={collection.actualRevenue} />
            </Text>
          </View>

          <View style={{ gap: 5, marginTop: 6 }}>
            <Line label="Différence recette théorique et réelle" indent compact>
              <Amount value={collection.theoreticalVsActualDiff} />
            </Line>
            <Line label="Différence de caisses" indent compact>
              <Amount value={collection.cashRegisterDiff} />
            </Line>
            <Line label="Solde différence" indent compact>
              <Amount value={collection.diffBalance} />
            </Line>
          </View>
        </View>

        <PdfTimestampFooter />
      </Page>
    </Document>
  )
}
