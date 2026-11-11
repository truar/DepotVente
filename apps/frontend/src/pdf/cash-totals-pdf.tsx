import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'
import { PdfPageNumberFooter } from '@/pdf/page-number-footer.tsx'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'
import { pdfDec, pdfEur, pdfInt } from '@/pdf/format.ts'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
    fontSize: 11,
    gap: 16,
  },
  header: {
    fontStyle: 'italic',
    fontSize: 14,
    flexDirection: 'row',
    gap: 5,
  },
  headerTitle: {
    gap: 5,
  },
  summary: {
    fontSize: 10,
    color: '#4b5563',
  },
  table: {
    width: 320,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#f3f4f6',
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#f9fafb',
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#e5e7eb',
    fontFamily: 'Helvetica-Bold',
  },
  colCoupure: {
    width: '35%',
    textAlign: 'right',
    paddingRight: 12,
  },
  colNombre: {
    width: '25%',
    textAlign: 'center',
  },
  colTotal: {
    width: '40%',
    textAlign: 'right',
  },
  colLabel: {
    width: '60%',
  },
})

export type CashTotalsData = {
  year: number
  /** « 9 contrôles de caisse : 3 dépôt, 4 vente, 2 retour » */
  controlsSummary: string
  rows: Array<{ value: number; count: number; amount: number }>
  notesAmount: number
  coinsAmount: number
  countedAmount: number
  initialAmount: number
  realAmount: number
}

export const coupure = (value: number) =>
  value < 1 ? `${pdfDec(value)} €` : `${value} €`

function TotalLine({
  label,
  value,
  style,
}: {
  label: string
  value: number
  style: typeof styles.totalRow
}) {
  return (
    <View style={style}>
      <Text style={styles.colLabel}>{label}</Text>
      <Text style={styles.colTotal}>{pdfEur(value)}</Text>
    </View>
  )
}

// Les billets et pièces de tous les contrôles de caisse réunis.
export const CashTotalsPdf = ({ data }: { data: CashTotalsData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <CMRLogo />
        <View style={styles.headerTitle}>
          <Text>Bourse aux skis {data.year}</Text>
          <Text>Club Montagnard Rumillien</Text>
          <Text>Espèces des caisses</Text>
        </View>
      </View>

      <Text style={styles.summary}>{data.controlsSummary}</Text>

      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={styles.colCoupure}>Coupure</Text>
          <Text style={styles.colNombre}>Nombre</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {data.rows.map((row) => (
          <View style={styles.row} key={row.value}>
            <Text style={styles.colCoupure}>{coupure(row.value)}</Text>
            <Text style={styles.colNombre}>{pdfInt(row.count)}</Text>
            <Text style={styles.colTotal}>{pdfEur(row.amount)}</Text>
          </View>
        ))}
        <TotalLine
          label="Total billets"
          value={data.notesAmount}
          style={styles.subtotalRow}
        />
        <TotalLine
          label="Total pièces"
          value={data.coinsAmount}
          style={styles.subtotalRow}
        />
        <TotalLine
          label="Total compté"
          value={data.countedAmount}
          style={styles.totalRow}
        />
        <TotalLine
          label="Fonds de caisse"
          value={-data.initialAmount}
          style={styles.subtotalRow}
        />
        <TotalLine
          label="Espèces réelles"
          value={data.realAmount}
          style={styles.totalRow}
        />
      </View>

      <PdfPageNumberFooter />
      <PdfTimestampFooter />
    </Page>
  </Document>
)
