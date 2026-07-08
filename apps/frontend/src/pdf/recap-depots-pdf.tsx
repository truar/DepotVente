import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'
import { PdfPageNumberFooter } from '@/pdf/page-number-footer.tsx'
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
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: { gap: 2 },
  headerDate: { fontSize: 9, color: '#4b5563' },
  section: { gap: 6 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 14 },
  table: { display: 'flex', width: 'auto' },
  row: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4 },
  headerRow: { backgroundColor: '#f3f4f6', fontFamily: 'Helvetica-Bold' },
  zebraRow: { backgroundColor: '#f3f4f6' },
  totalRow: {
    fontFamily: 'Helvetica-Bold',
    borderTopWidth: 1,
    borderColor: '#6b7280',
  },
  cellLabel: { flex: 1 },
  cellNum: { flex: 1, textAlign: 'right' },
})

/** Currency, grouped, 2 decimals: "4 079,00 €", "156 679,98 €". */
const Eur = ({ value }: { value: number }) => <>{pdfEur(value)}</>

/** Render 0 as an empty cell (matches the reference report). */
const orBlank = (n: number) => (n === 0 ? '' : n)

export type RecapDepotsRow = {
  cashRegisterId: number
  sellersCount: number
  predepositsCount: number
  depositValue: number
  articlesCount: number
  contribution: number
}

export type RecapDepotsData = {
  year: number
  deposits: Array<RecapDepotsRow>
  depositsTotal: Omit<RecapDepotsRow, 'cashRegisterId'>
  predeposits: {
    count: number
    articlesCount: number
    value: number
    notConfirmed: number
    confirmed: number
  }
}

export type RecapDepotsProps = { data: RecapDepotsData }

export const RecapDepotsPdf = ({ data }: RecapDepotsProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <CMRLogo />
          <View style={styles.headerTitle}>
            <Text>Bourse aux skis</Text>
            <Text>{data.year}</Text>
            <Text>Récapitulatifs dépôts/pré-dépôts</Text>
          </View>
        </View>
        <Text style={styles.headerDate}>
          {timestampFormatter.format(new Date())}
        </Text>
      </View>

      {/* Dépôts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dépôts</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellLabel}>Caisse</Text>
            <Text style={styles.cellNum}>Nb Vendeurs</Text>
            <Text style={styles.cellNum}>Nb Pré-dépôts</Text>
            <Text style={styles.cellNum}>Valeur dépôt</Text>
            <Text style={styles.cellNum}>Nb Articles</Text>
            <Text style={styles.cellNum}>Cotisation</Text>
          </View>
          {data.deposits.map((r, i) => (
            <View
              key={r.cashRegisterId}
              style={[styles.row, ...(i % 2 === 1 ? [styles.zebraRow] : [])]}
            >
              <Text style={styles.cellLabel}>{r.cashRegisterId}</Text>
              <Text style={styles.cellNum}>{r.sellersCount}</Text>
              <Text style={styles.cellNum}>{orBlank(r.predepositsCount)}</Text>
              <Text style={styles.cellNum}>
                <Eur value={r.depositValue} />
              </Text>
              <Text style={styles.cellNum}>{r.articlesCount}</Text>
              <Text style={styles.cellNum}>
                {r.contribution === 0 ? '' : <Eur value={r.contribution} />}
              </Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.cellLabel}>Total</Text>
            <Text style={styles.cellNum}>
              {data.depositsTotal.sellersCount}
            </Text>
            <Text style={styles.cellNum}>
              {data.depositsTotal.predepositsCount}
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.depositsTotal.depositValue} />
            </Text>
            <Text style={styles.cellNum}>
              {data.depositsTotal.articlesCount}
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.depositsTotal.contribution} />
            </Text>
          </View>
        </View>
      </View>

      {/* Pré-dépôts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pré-dépôts</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellNum}>Nb pré-dépôts</Text>
            <Text style={styles.cellNum}>Nb articles</Text>
            <Text style={styles.cellNum}>Valeur pré-dépôt</Text>
            <Text style={styles.cellNum}>Nb non confirmés</Text>
            <Text style={styles.cellNum}>Nb confirmés</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellNum}>{data.predeposits.count}</Text>
            <Text style={styles.cellNum}>{data.predeposits.articlesCount}</Text>
            <Text style={styles.cellNum}>
              <Eur value={data.predeposits.value} />
            </Text>
            <Text style={styles.cellNum}>{data.predeposits.notConfirmed}</Text>
            <Text style={styles.cellNum}>{data.predeposits.confirmed}</Text>
          </View>
        </View>
      </View>

      <PdfPageNumberFooter />
    </Page>
  </Document>
)
