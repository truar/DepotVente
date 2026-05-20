import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { IntlProvider } from 'react-intl'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
})

// All position/size values are in millimetres so they map directly to the
// physical layout of a French check on an A4 page (210 × 297 mm). The only
// exception is `amountFontSize`, which is in points — the standard typographic
// unit.
export type CheckPrintOffsets = {
  outerTranslateX: number
  outerTranslateY: number
  outerGap: number
  leftMarginLeft: number
  leftMarginTop: number
  leftRowGap: number
  textualAmountWidth: number
  sellerMarginLeft: number
  sellerWidth: number
  rightMarginTop: number
  rightRowGap: number
  amountWidth: number
  amountFontSize: number
  dateCityMarginLeft: number
  dateCityGap: number
  dateCityWidth: number
}

// Geometry: A4 portrait (210 × 297 mm). The check is fed with its long side
// running top-to-bottom on the A4 sheet, so the layout is rotated 90° before
// translation. Because the rotation is applied first, outerTranslate{X,Y}
// values live in the rotated frame: +outerTranslateX pushes content DOWN the
// page, -outerTranslateY pushes content RIGHT across the page. Inner offsets
// (leftMarginTop etc.) read normally — i.e. leftMarginTop = 20 mm means the
// textual-amount line sits 20 mm from the check's top edge.
export const DEFAULT_CHECK_PRINT_OFFSETS: CheckPrintOffsets = {
  outerTranslateX: 280.6,
  outerTranslateY: -94.9,
  outerGap: 6,
  leftMarginLeft: -7,
  leftMarginTop: 53,
  leftRowGap: 8,
  textualAmountWidth: 98,
  sellerMarginLeft: -24,
  sellerWidth: 86,
  rightMarginTop: 62,
  rightRowGap: 5,
  amountWidth: 30,
  amountFontSize: 11,
  dateCityMarginLeft: -2,
  dateCityGap: 3,
  dateCityWidth: 29,
}

export type SellerCheckPdfProps = {
  data: PdfData
  offsets?: Partial<CheckPrintOffsets>
  // When set, every field gets this colour as a background rectangle so the
  // operator can see where text is going to land on a blank test print.
  // Leave undefined for the real check print.
  guideColor?: string
  // When true, also paint a light-grey rectangle behind the layout to show
  // where the physical check sits on the A4 sheet. Disabled by default so
  // real prints don't waste ink.
  showCheckOutline?: boolean
}

type PdfData = {
  textualAmount: string
  amount: number
  seller: string
  date: Date
  city: string
}

const mm = (v: number) => `${v}mm`

// Physical check dimensions. The check is fed long-side-vertical, anchored
// to the top of A4 portrait (210 × 297 mm) and centred horizontally, so it
// occupies 80 mm horizontally and 175 mm vertically starting at the page top.
const A4_WIDTH_MM = 210
const CHECK_WIDTH_MM = 80
const CHECK_HEIGHT_MM = 175
const CHECK_LEFT_MM = (A4_WIDTH_MM - CHECK_WIDTH_MM) / 2
const CHECK_TOP_MM = 0

export const SellerCheckPdf = (props: SellerCheckPdfProps) => {
  const { data, offsets: offsetsOverride, guideColor, showCheckOutline = false } = props
  const o: CheckPrintOffsets = { ...DEFAULT_CHECK_PRINT_OFFSETS, ...offsetsOverride }
  const guide = guideColor
  return (
    <IntlProvider locale={'fr'}>
      <Document>
        <Page size="A4" style={styles.page}>
          <View
            style={{
              position: 'absolute',
              left: mm(CHECK_LEFT_MM),
              top: mm(CHECK_TOP_MM),
              width: mm(CHECK_WIDTH_MM),
              height: mm(CHECK_HEIGHT_MM),
              backgroundColor: showCheckOutline ? '#e5e5e5' : 'transparent',
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              gap: mm(o.outerGap),
              transform: `rotate(90deg) translate(${mm(o.outerTranslateX)}, ${mm(o.outerTranslateY)})`,
            }}
          >
            <View
              style={{
                flexDirection: 'column',
                gap: mm(o.leftRowGap),
                marginLeft: mm(o.leftMarginLeft),
                marginTop: mm(o.leftMarginTop),
              }}
            >
              <Text
                style={{ backgroundColor: guide, width: mm(o.textualAmountWidth) }}
              >
                {data.textualAmount}
              </Text>
              <Text
                style={{
                  backgroundColor: guide,
                  width: mm(o.sellerWidth),
                  marginLeft: mm(o.sellerMarginLeft),
                }}
              >
                {data.seller}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'column',
                gap: mm(o.rightRowGap),
                marginTop: mm(o.rightMarginTop),
              }}
            >
              <Text
                style={{
                  backgroundColor: guide,
                  width: mm(o.amountWidth),
                  fontSize: o.amountFontSize,
                }}
              >
                {data.amount}
              </Text>
              <View
                style={{
                  flexDirection: 'column',
                  marginLeft: mm(o.dateCityMarginLeft),
                  gap: mm(o.dateCityGap),
                }}
              >
                <Text style={{ backgroundColor: guide, width: mm(o.dateCityWidth) }}>
                  {data.city}
                </Text>
                <Text style={{ backgroundColor: guide, width: mm(o.dateCityWidth) }}>
                  {data.date.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </Page>
      </Document>
    </IntlProvider>
  )
}
