import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { FormattedNumber, IntlProvider } from 'react-intl'
import { CMRLogo } from '@/pdf/cmr-logo.tsx'

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
})

export type SellerCheckPdfProps = {
  data: PdfData
}

type PdfData = {
  textualAmount: string
  amount: number
  seller: string
  date: Date
  city: string
}

export const SellerCheckPdf = (props: SellerCheckPdfProps) => {
  const { data } = props
  return (
    <IntlProvider locale={'fr'}>
      <Document>
        <Page size="A4" style={styles.page}>
          <View
            style={{
              flexDirection: 'row',
              gap: '34px',
              transform: 'rotate(90deg) translate(250px, -243px)',
            }}
          >
            <View
              style={{
                flexDirection: 'column',
                gap: '5px',
                marginLeft: '8px',
                marginTop: '59px',
              }}
            >
              <Text style={{ backgroundColor: '#ccc', width: '332px' }}>
                {data.textualAmount}
              </Text>
              <Text
                style={{
                  backgroundColor: '#ccc',
                  width: '326px',
                  marginLeft: '6px',
                }}
              >
                {data.seller}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'column',
                gap: '5px',
                marginTop: '67px',
              }}
            >
              <Text
                style={{
                  backgroundColor: '#ccc',
                  width: '113px',
                  fontSize: '11px',
                }}
              >
                {data.amount}
              </Text>
              <View
                style={{
                  flexDirection: 'column',
                  marginLeft: '3px',
                  gap: '1px',
                }}
              >
                <Text style={{ backgroundColor: '#ccc', width: '110px' }}>
                  {data.city}
                </Text>
                <Text style={{ backgroundColor: '#ccc', width: '110px' }}>
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
