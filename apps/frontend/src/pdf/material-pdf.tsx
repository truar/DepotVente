import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'
import { PdfPageNumberFooter } from '@/pdf/page-number-footer.tsx'

const INK = '#000000'
const RED = '#E11414'

/** Integer, French grouping, with Helvetica-safe spaces ("2 056"). */
const numFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const num = (n: number) =>
  numFmt.format(n).replace(/[\u202F\u00A0\u2009]/g, ' ')

// Percentage with no space before "%", matching the reference ("42,02%").
const pctFmt = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const pctTight = (n: number) =>
  `${pctFmt.format(n * 100).replace(/[\u202F\u00A0\u2009]/g, ' ')}%`

/** App discipline -> the wording used on the legacy material report. */
const DISCIPLINE_PHRASE: Record<string, string> = {
  Alpin: 'ski piste',
  Fond: 'ski fond',
  'Rando Alpine': 'rando alpine',
  'Rando Pédestre': 'rando pédestre',
  Telemark: 'télémark',
}

/** "Nombre chaussures surf", "Nombre articles ski fond", … */
const discLabel = (category: string, discipline: string) => {
  const noun = category === 'Skis' ? 'articles' : category.toLowerCase()
  const phrase = DISCIPLINE_PHRASE[discipline] ?? discipline.toLowerCase()
  return `Nombre ${noun} ${phrase}`
}

/** Data category -> the wording shown on the legacy report. */
const DISPLAY_NAME: Record<string, string> = {
  Casque: 'Casques',
  'Masque Ski': 'Masque ski',
  'Housse Ski': 'Housse ski',
  Vêtement: 'Vêtements',
}

/** Category display order on the legacy report. */
const ORDER = [
  'Skis',
  'Snowboard',
  'Casque',
  'Masque Ski',
  'Housse Ski',
  'Chaussures',
  'Bâtons',
  'Fixations',
  'Raquettes',
  'Vêtement',
  'Divers',
]
const DIVERS_RANK = ORDER.indexOf('Divers')
// Unlisted categories (Gants, …) sort in just before the "Divers" catch-all.
const rank = (category: string) => {
  const i = ORDER.indexOf(category)
  return i === -1 ? DIVERS_RANK - 0.5 : i
}

// Shared column geometry so header / boxed total / sub-rows all line up.
const LABEL_W = 92
const DESC_W = 214
const NUM_W = 52
const PCT_W = 52

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#111827',
  },
  title: {
    fontFamily: 'Times-BoldItalic',
    fontSize: 17,
    color: INK,
    textAlign: 'center',
    marginBottom: 10,
  },

  group: { marginBottom: 4 },
  headRow: { flexDirection: 'row' },
  totalRow: { flexDirection: 'row', alignItems: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center' },

  labelSpacer: { width: LABEL_W },
  descSpacer: { width: DESC_W },
  catLabel: {
    width: LABEL_W,
    paddingRight: 6,
    textAlign: 'right',
    fontFamily: 'Times-BoldItalic',
    fontSize: 12,
    color: INK,
  },

  headNum: {
    width: NUM_W,
    textAlign: 'center',
    fontFamily: 'Times-Italic',
    fontSize: 8.5,
    color: INK,
  },

  // The boxed "Total articles" row (rectangle hugs desc + the two numbers).
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.75,
    borderColor: '#6b7280',
    paddingVertical: 1.5,
  },
  totalLabel: {
    width: DESC_W,
    paddingLeft: 4,
    fontFamily: 'Times-Italic',
    fontSize: 9.5,
  },
  subLabel: {
    width: DESC_W,
    paddingLeft: 12,
    fontFamily: 'Times-Italic',
    fontSize: 8.5,
    color: '#374151',
  },
  depNum: {
    width: NUM_W,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: RED,
  },
  soldNum: {
    width: NUM_W,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#111827',
  },
  subDep: {
    width: NUM_W,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: RED,
  },
  subSold: {
    width: NUM_W,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#111827',
  },
  pct: {
    width: PCT_W + 8,
    paddingLeft: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  groupRule: {
    marginLeft: LABEL_W,
    width: DESC_W + NUM_W * 2,
    borderTopWidth: 0.5,
    borderColor: '#d1d5db',
    marginTop: 1,
  },

  // ── Grand total ─────────────────────────────────────────────
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 8,
    gap: 5,
  },
  grandWord: { fontFamily: 'Times-BoldItalic', fontSize: 18, color: INK },
  grandSmall: { fontFamily: 'Times-Italic', fontSize: 11, color: INK },
  grandDep: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: RED },
  grandSold: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#111827' },
  grandPct: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#111827' },

  // ── Pro / particulier split (boxed, bottom-left) ────────────
  splitRowWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  splitTable: {
    borderWidth: 0.75,
    borderColor: '#6b7280',
    width: 340,
  },
  splitHeadRow: { flexDirection: 'row', paddingVertical: 2, paddingHorizontal: 4 },
  splitRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderTopWidth: 0.5,
    borderColor: '#d1d5db',
  },
  splitName: {
    width: 108,
    fontFamily: 'Times-BoldItalic',
    fontSize: 10,
    color: INK,
  },
  splitHeadCell: {
    width: 58,
    textAlign: 'right',
    fontFamily: 'Times-Italic',
    fontSize: 8,
    color: INK,
  },
  splitNum: {
    width: 58,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  splitPct: {
    width: 58,
    textAlign: 'right',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#374151',
  },
})

export type MaterialDisciplineRow = {
  discipline: string
  depositCount: number
  soldCount: number
}

export type MaterialCategoryBlock = {
  category: string
  depositCount: number
  soldCount: number
  /** soldCount / depositCount */
  soldRatio: number
  disciplines: Array<MaterialDisciplineRow>
}

export type MaterialTypeSplit = {
  label: string
  depositCount: number
  /** depositCount / total deposit */
  depositShare: number
  soldCount: number
  /** soldCount / depositCount (sell-through) */
  soldRatio: number
}

export type MaterialData = {
  year: number
  categories: Array<MaterialCategoryBlock>
  totalDeposit: number
  totalSold: number
  /** totalSold / totalDeposit */
  totalRatio: number
  splits: Array<MaterialTypeSplit>
}

export type MaterialProps = { data: MaterialData }

const CategoryGroup = ({
  block,
  displayName,
  showHeader,
}: {
  block: MaterialCategoryBlock
  displayName: string
  showHeader: boolean
}) => (
  <View style={styles.group} wrap={false}>
    {showHeader && (
      <View style={styles.headRow}>
        <View style={styles.labelSpacer} />
        <View style={styles.descSpacer} />
        <Text style={styles.headNum}>En Dépôt</Text>
        <Text style={styles.headNum}>Vendu</Text>
      </View>
    )}

    <View style={styles.totalRow}>
      <Text style={styles.catLabel}>{displayName}</Text>
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total articles</Text>
        <Text style={styles.depNum}>{block.depositCount}</Text>
        <Text style={styles.soldNum}>{block.soldCount}</Text>
      </View>
      <Text style={styles.pct}>
        {block.depositCount === 0 ? '' : pctTight(block.soldRatio)}
      </Text>
    </View>

    {block.disciplines.map((d) => (
      <View key={d.discipline} style={styles.subRow}>
        <View style={styles.labelSpacer} />
        <Text style={styles.subLabel}>{discLabel(block.category, d.discipline)}</Text>
        <Text style={styles.subDep}>{d.depositCount}</Text>
        <Text style={styles.subSold}>{d.soldCount}</Text>
      </View>
    ))}

    <View style={styles.groupRule} />
  </View>
)

export const MaterialPdf = ({ data }: MaterialProps) => {
  const blocks = data.categories
    .slice()
    .sort((a, b) => rank(a.category) - rank(b.category))
  // Categories with a discipline breakdown carry their own header; the plain
  // single-line categories that trail the last breakdown do too. The plain
  // categories wedged *between* breakdowns share the header above them.
  const lastDiscIdx = blocks.reduce(
    (acc, b, i) => (b.disciplines.length > 0 ? i : acc),
    -1,
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Bilan matériel Bourse aux skis  {data.year}</Text>

        {blocks.map((b, i) => (
          <CategoryGroup
            key={b.category}
            block={b}
            displayName={DISPLAY_NAME[b.category] ?? b.category}
            showHeader={i === 0 || b.disciplines.length > 0 || i > lastDiscIdx}
          />
        ))}

      <View style={styles.grandRow}>
        <Text style={styles.grandWord}>Total articles</Text>
        <Text style={styles.grandSmall}>En Dépôt :</Text>
        <Text style={styles.grandDep}>{data.totalDeposit}</Text>
        <Text style={styles.grandSmall}>   Vendus :</Text>
        <Text style={styles.grandSold}>{data.totalSold}</Text>
        <Text style={styles.grandSmall}>   Soit</Text>
        <Text style={styles.grandPct}>{pctTight(data.totalRatio)}</Text>
      </View>

      <View style={styles.splitRowWrap}>
        <View style={styles.splitTable}>
          <View style={styles.splitHeadRow}>
            <Text style={styles.splitName} />
            <Text style={styles.splitHeadCell}>Dépôt</Text>
            <Text style={styles.splitHeadCell} />
            <Text style={styles.splitHeadCell}>Vendus</Text>
            <Text style={styles.splitHeadCell}>- % sur dépôt</Text>
          </View>
          {data.splits.map((s) => (
            <View key={s.label} style={styles.splitRow}>
              <Text style={styles.splitName}>{s.label} :</Text>
              <Text style={styles.splitNum}>{num(s.depositCount)}</Text>
              <Text style={styles.splitPct}>{pctTight(s.depositShare)}</Text>
              <Text style={styles.splitNum}>{num(s.soldCount)}</Text>
              <Text style={styles.splitPct}>{pctTight(s.soldRatio)}</Text>
            </View>
          ))}
        </View>
      </View>

      <PdfPageNumberFooter />
      <PdfTimestampFooter />
    </Page>
  </Document>
  )
}
