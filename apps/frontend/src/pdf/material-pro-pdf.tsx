import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { pdfEur } from '@/pdf/format.ts'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'
import { PdfPageNumberFooter } from '@/pdf/page-number-footer.tsx'

const BLUE = '#1F3864'

// Percentage with no space before "%", matching the reference ("37,09%").
const pctFmt = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const pctTight = (n: number) =>
  `${pctFmt.format(n * 100).replace(/[\u202F\u00A0\u2009]/g, ' ')}%`

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  titleWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 14 },
  title: { fontFamily: 'Times-BoldItalic', fontSize: 21, color: BLUE },
  seller: { fontFamily: 'Times-BoldItalic', fontSize: 21, color: BLUE },
  bourse: { fontFamily: 'Times-BoldItalic', fontSize: 15, color: BLUE },
  fiche: {
    fontFamily: 'Times-BoldItalic',
    fontSize: 13,
    color: BLUE,
    marginTop: 6,
    marginBottom: 12,
  },

  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.2,
    borderColor: BLUE,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  colHead: {
    fontFamily: 'Times-BoldItalic',
    fontSize: 8.5,
    color: BLUE,
    textAlign: 'right',
    paddingHorizontal: 2,
  },
  colHeadLeft: {
    fontFamily: 'Times-BoldItalic',
    fontSize: 8.5,
    color: BLUE,
    textAlign: 'left',
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 7,
    alignItems: 'center',
  },
  bottomRule: { borderTopWidth: 0.5, borderColor: '#d1d5db' },
  catCell: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, paddingHorizontal: 2 },
  numCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'right',
    paddingHorizontal: 2,
  },

  globalTitle: {
    fontFamily: 'Times-BoldItalic',
    fontSize: 21,
    color: BLUE,
    marginTop: 24,
    marginBottom: 12,
  },
  globalRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 9 },
  globalLabel: {
    fontFamily: 'Times-BoldItalic',
    fontSize: 12,
    color: BLUE,
    width: 270,
    textAlign: 'right',
    marginRight: 16,
  },
  globalValue: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
})

/** column definitions in the reference order (after the "Materiel" label). */
type ColKind = 'int' | 'eur' | 'pct'
const COLS: Array<{ label: string; key: keyof MaterialProCategoryRow; kind: ColKind }> = [
  { label: 'Nb Articles en dépôt', key: 'depositCount', kind: 'int' },
  { label: 'Montant du dépôt', key: 'depositAmount', kind: 'eur' },
  { label: 'Prix mini dépôt', key: 'depositMinPrice', kind: 'eur' },
  { label: 'Prix max dépôt', key: 'depositMaxPrice', kind: 'eur' },
  { label: 'Prix moyen dépôt', key: 'depositAvgPrice', kind: 'eur' },
  { label: 'Nb Articles vendus', key: 'soldCount', kind: 'int' },
  { label: 'Montant de la vente', key: 'soldAmount', kind: 'eur' },
  { label: 'Prix mini Vente', key: 'soldMinPrice', kind: 'eur' },
  { label: 'Prix maxi Vente', key: 'soldMaxPrice', kind: 'eur' },
  { label: '% dépôt/vente', key: 'soldRatio', kind: 'pct' },
  { label: 'Prix moyen', key: 'soldAvgPrice', kind: 'eur' },
]

const LABEL_FLEX = 1.7

const fmtCell = (row: MaterialProCategoryRow, kind: ColKind, key: keyof MaterialProCategoryRow) => {
  const v = row[key] as number
  if (v === 0) return ''
  if (kind === 'int') return String(v)
  if (kind === 'pct') return pctTight(v)
  return pdfEur(v)
}

export type MaterialProCategoryRow = {
  category: string
  depositCount: number
  depositAmount: number
  depositMinPrice: number
  depositMaxPrice: number
  depositAvgPrice: number
  soldCount: number
  soldAmount: number
  soldMinPrice: number
  soldMaxPrice: number
  /** soldCount / depositCount */
  soldRatio: number
  /** soldAmount / soldCount */
  soldAvgPrice: number
}

export type MaterialProFiche = {
  depositIndex: number
  sellerName: string
  rows: Array<MaterialProCategoryRow>
  total: {
    depositCount: number
    depositAmount: number
    soldCount: number
    soldAmount: number
    /** soldCount / depositCount */
    soldRatio: number
  }
}

export type MaterialProData = {
  year: number
  fiches: Array<MaterialProFiche>
}

export type MaterialProProps = { data: MaterialProData }

const FichePage = ({ fiche, year }: { fiche: MaterialProFiche; year: number }) => (
  <Page size="A4" orientation="landscape" style={styles.page}>
    <View style={styles.header}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Bilan Matériel</Text>
        <Text style={styles.seller}>{fiche.sellerName}</Text>
      </View>
      <Text style={styles.bourse}>Bourse aux skis RUMILLY  Année {year}</Text>
    </View>
    <Text style={styles.fiche}>Fiche N°: {fiche.depositIndex}</Text>

    <View style={styles.headerRow} fixed>
      <Text style={[styles.colHeadLeft, { flex: LABEL_FLEX }]}>Materiel</Text>
      {COLS.map((c) => (
        <Text key={c.key} style={[styles.colHead, { flex: 1 }]}>
          {c.label}
        </Text>
      ))}
    </View>

    {fiche.rows.map((r) => (
      <View key={r.category} style={styles.row} wrap={false}>
        <Text style={[styles.catCell, { flex: LABEL_FLEX }]}>{r.category}</Text>
        {COLS.map((c) => (
          <Text key={c.key} style={[styles.numCell, { flex: 1 }]}>
            {fmtCell(r, c.kind, c.key)}
          </Text>
        ))}
      </View>
    ))}
    <View style={styles.bottomRule} />

    <Text style={styles.globalTitle}>Bilan global</Text>
    <View style={styles.globalRow}>
      <Text style={styles.globalLabel}>Nb total Articles en dépôt</Text>
      <Text style={styles.globalValue}>{fiche.total.depositCount}</Text>
    </View>
    <View style={styles.globalRow}>
      <Text style={styles.globalLabel}>Montant total du dépôt</Text>
      <Text style={styles.globalValue}>{pdfEur(fiche.total.depositAmount)}</Text>
    </View>
    <View style={styles.globalRow}>
      <Text style={styles.globalLabel}>Nb total Articles Vendus</Text>
      <Text style={styles.globalValue}>{fiche.total.soldCount}</Text>
    </View>
    <View style={styles.globalRow}>
      <Text style={styles.globalLabel}>Montant total de la Vente</Text>
      <Text style={styles.globalValue}>{pdfEur(fiche.total.soldAmount)}</Text>
    </View>
    <View style={styles.globalRow}>
      <Text style={styles.globalLabel}>% dépôt/vente</Text>
      <Text style={styles.globalValue}>{pctTight(fiche.total.soldRatio)}</Text>
    </View>

    <PdfPageNumberFooter />
    <PdfTimestampFooter />
  </Page>
)

export const MaterialProPdf = ({ data }: MaterialProProps) => (
  <Document>
    {data.fiches.map((fiche) => (
      <FichePage key={fiche.depositIndex} fiche={fiche} year={data.year} />
    ))}
  </Document>
)
