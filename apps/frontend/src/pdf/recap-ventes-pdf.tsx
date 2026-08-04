import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'
import { PdfPageNumberFooter } from '@/pdf/page-number-footer.tsx'
import { PdfTimestampFooter } from '@/pdf/timestamp-footer.tsx'
import { pdfEur } from '@/pdf/format.ts'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
    fontSize: 10,
    gap: 20,
  },
  header: {
    fontStyle: 'italic',
    fontSize: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: { gap: 5 },
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
  /** cartes nettes = Σ vente.cardAmount − Σ remboursement.cardAmount */
  cards: number
  /** espèces réellement comptées au contrôle, hors fond de caisse */
  cash: number
  deferred: number
  /** encaissé = cartes + espèces comptées + différé + chèques */
  collected: number
  /** vendu = même somme, mais avec les espèces théoriques (ventes − remb.) */
  sold: number
  /** écart de caisse = encaissé − vendu */
  diff: number
}

export type RecapTransactionsRow = {
  cashRegisterId: number
  /** Σ prix des articles vendus, rattachés à la caisse de leur vente */
  soldAmount: number
  salesCount: number
  articlesCount: number
  /** les quatre suivants sont des nombres de ventes, pas des montants */
  checks: number
  cash: number
  deferred: number
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
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <CMRLogo />
          <View style={styles.headerTitle}>
            <Text>Bourse au skis {data.year}</Text>
            <Text>Club Montagnard Rumillien</Text>
            <Text>Récapitulatif des ventes</Text>
          </View>
        </View>
      </View>

      {/* Récapitulatif des encaissements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Récapitulatif des encaissements</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellLabel}>Caisse</Text>
            <Text style={styles.cellNum}>Cartes</Text>
            <Text style={styles.cellNum}>Espèces</Text>
            <Text style={styles.cellNum}>Différé</Text>
            <Text style={styles.cellNum}>Chèques</Text>
            <Text style={styles.cellNum}>Encaissé</Text>
            <Text style={styles.cellNum}>Vendu</Text>
            <Text style={styles.cellNum}>Diff</Text>
          </View>
          {data.sales.map((r, i) => (
            <View
              key={r.cashRegisterId}
              style={[styles.row, ...(i % 2 === 1 ? [styles.zebraRow] : [])]}
            >
              <Text style={styles.cellLabel}>{r.cashRegisterId}</Text>
              <Text style={styles.cellNum}>
                <Eur value={r.cards} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.cash} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.deferred} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.checks} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.collected} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.sold} />
              </Text>
              <Text style={styles.cellNum}>
                <Eur value={r.diff} />
              </Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.cellLabel}>Total</Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.cards} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.cash} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.deferred} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.checks} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.collected} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.sold} />
            </Text>
            <Text style={styles.cellNum}>
              <Eur value={data.salesTotal.diff} />
            </Text>
          </View>
        </View>
      </View>

      {/* Récapitulatif des ventes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Récapitulatif des ventes</Text>
        <Text style={styles.emptyText}>
          Cartes, Espèces, Différé et Chèques comptent les ventes réglées avec
          ce moyen de paiement — une vente mixte compte dans chacun.
        </Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellLabel}>Caisse</Text>
            <Text style={styles.cellNum}>Mt vente</Text>
            <Text style={styles.cellNum}>Nb vente</Text>
            <Text style={styles.cellNum}>Nb articles</Text>
            <Text style={styles.cellNum}>Cartes</Text>
            <Text style={styles.cellNum}>Espèces</Text>
            <Text style={styles.cellNum}>Différé</Text>
            <Text style={styles.cellNum}>Chèques</Text>
          </View>
          {data.transactions.map((r, i) => (
            <View
              key={r.cashRegisterId}
              style={[styles.row, ...(i % 2 === 1 ? [styles.zebraRow] : [])]}
            >
              <Text style={styles.cellLabel}>{r.cashRegisterId}</Text>
              <Text style={styles.cellNum}>
                <Eur value={r.soldAmount} />
              </Text>
              <Text style={styles.cellNum}>{r.salesCount}</Text>
              <Text style={styles.cellNum}>{r.articlesCount}</Text>
              <Text style={styles.cellNum}>{r.cards}</Text>
              <Text style={styles.cellNum}>{r.cash}</Text>
              <Text style={styles.cellNum}>{r.deferred}</Text>
              <Text style={styles.cellNum}>{r.checks}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.cellLabel}>Total</Text>
            <Text style={styles.cellNum}>
              <Eur value={data.transactionsTotal.soldAmount} />
            </Text>
            <Text style={styles.cellNum}>
              {data.transactionsTotal.salesCount}
            </Text>
            <Text style={styles.cellNum}>
              {data.transactionsTotal.articlesCount}
            </Text>
            <Text style={styles.cellNum}>{data.transactionsTotal.cards}</Text>
            <Text style={styles.cellNum}>{data.transactionsTotal.cash}</Text>
            <Text style={styles.cellNum}>
              {data.transactionsTotal.deferred}
            </Text>
            <Text style={styles.cellNum}>{data.transactionsTotal.checks}</Text>
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
            <Text style={styles.cellNum}>Remb. CB</Text>
            <Text style={styles.cellNum}>Remb. espèces</Text>
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
                  <Eur value={r.refundCard} />
                </Text>
                <Text style={styles.cellNum}>
                  <Eur value={r.refundCash} />
                </Text>
                <Text style={styles.cellNum}>
                  <Eur value={r.total} />
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <PdfPageNumberFooter />
      <PdfTimestampFooter />
    </Page>
  </Document>
)
