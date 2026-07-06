import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'
import { pdfEur } from '@/pdf/format.ts'

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
    fontSize: 10,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: { gap: 2 },
  headerDate: { fontSize: 9, color: '#4b5563' },
  section: { gap: 6 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textDecoration: 'underline',
  },
  table: { display: 'flex', width: 'auto' },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerRow: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Helvetica-Bold',
  },
  zebraRow: { backgroundColor: '#f3f4f6' },
  totalRow: {
    fontFamily: 'Helvetica-Bold',
    borderTopWidth: 1,
    borderColor: '#6b7280',
  },
  cellLabel: { flex: 1 },
  cellNum: { flex: 1, textAlign: 'right' },
  emptyText: { fontSize: 9, color: '#6b7280', fontStyle: 'italic' },
})

const Eur = ({ value }: { value: number }) => <>{pdfEur(value)}</>

export type RecapVentesRow = {
  cashRegisterId: number
  checks: number
  cards: number
  /** espèces = espèces + paiements différés */
  cash: number
  /** total brut = chèques + cartes + espèces (avant remboursement) */
  total: number
  refund: number
  /** ventes nettes = total − remboursements */
  net: number
}

export type RecapTransactionsRow = {
  cashRegisterId: number
  checks: number
  cash: number
  cards: number
}

export type RecapRefundRow = {
  cashRegisterId: number
  saleIndex: number
  refundCash: number
  refundCard: number
  total: number
}

export type RecapVentesData = {
  year: number
  sales: Array<RecapVentesRow>
  salesTotal: Omit<RecapVentesRow, 'cashRegisterId'>
  transactions: Array<RecapTransactionsRow>
  transactionsTotal: Omit<RecapTransactionsRow, 'cashRegisterId'>
  refunds: Array<RecapRefundRow>
}

export type RecapVentesProps = { data: RecapVentesData }

export const RecapVentesPdf = ({ data }: RecapVentesProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <CMRLogo />
          <View style={styles.headerTitle}>
            <Text>Bourse aux skis</Text>
            <Text>{data.year}</Text>
            <Text>Récapitulatif des ventes</Text>
          </View>
        </View>
        <Text style={styles.headerDate}>
          {timestampFormatter.format(new Date())}
        </Text>
      </View>

      {/* Récapitulatif des ventes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Récapitulatif des ventes</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellLabel}>Caisse</Text>
            <Text style={styles.cellNum}>Chèques</Text>
            <Text style={styles.cellNum}>Cartes</Text>
            <Text style={styles.cellNum}>Espèces</Text>
            <Text style={styles.cellNum}>Total</Text>
            <Text style={styles.cellNum}>Remb.</Text>
            <Text style={styles.cellNum}>Ventes</Text>
          </View>
          {data.sales.map((r, i) => (
            <View
              key={r.cashRegisterId}
              style={[styles.row, ...(i % 2 === 1 ? [styles.zebraRow] : [])]}
            >
              <Text style={styles.cellLabel}>{r.cashRegisterId}</Text>
              <Text style={styles.cellNum}>
                <Eur value={r.checks} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.cards} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.cash} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.total} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.refund} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.net} />
              </Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.cellLabel}>Total</Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.checks} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.cards} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.cash} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.total} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.refund} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.net} />
            </Text>
          </View>
        </View>
      </View>

      {/* Nb de transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nb de transactions</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellLabel}>Caisse</Text>
            <Text style={styles.cellNum}>Chèques</Text>
            <Text style={styles.cellNum}>Espèces</Text>
            <Text style={styles.cellNum}>Cartes</Text>
          </View>
          {data.transactions.map((r, i) => (
            <View
              key={r.cashRegisterId}
              style={[styles.row, ...(i % 2 === 1 ? [styles.zebraRow] : [])]}
            >
              <Text style={styles.cellLabel}>{r.cashRegisterId}</Text>
              <Text style={styles.cellNum}>{r.checks || ''}</Text>
              <Text style={styles.cellNum}>{r.cash || ''}</Text>
              <Text style={styles.cellNum}>{r.cards || ''}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.cellLabel}>Total</Text>
            <Text style={styles.cellNum}>{data.transactionsTotal.checks}</Text>
            <Text style={styles.cellNum}>{data.transactionsTotal.cash}</Text>
            <Text style={styles.cellNum}>{data.transactionsTotal.cards}</Text>
          </View>
        </View>
      </View>

      {/* Remboursements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remboursements</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellLabel}>Caisse</Text>
            <Text style={styles.cellLabel}>Vente n°</Text>
            <Text style={styles.cellNum}>Remb. espèces</Text>
            <Text style={styles.cellNum}>Remb. CB</Text>
            <Text style={styles.cellNum}>Total remb.</Text>
          </View>
          {data.refunds.length === 0 ? (
            <View style={styles.row}>
              <Text style={styles.emptyText}>Aucun remboursement</Text>
            </View>
          ) : (
            data.refunds.map((r, i) => (
              <View
                key={`${r.cashRegisterId}-${r.saleIndex}-${i}`}
                style={[styles.row, ...(i % 2 === 1 ? [styles.zebraRow] : [])]}
              >
                <Text style={styles.cellLabel}>{r.cashRegisterId}</Text>
                <Text style={styles.cellLabel}>{r.saleIndex}</Text>
                <Text style={styles.cellNum}>
                  <Eur value={r.refundCash} />
                </Text>
                <Text style={styles.cellNum}>
                  <Eur value={r.refundCard} />
                </Text>
                <Text style={styles.cellNum}>
                  <Eur value={r.total} />
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <PdfTimestampFooter />
    </Page>
  </Document>
)
