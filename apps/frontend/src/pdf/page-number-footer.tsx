import { Text, View } from '@react-pdf/renderer'

/**
 * Fixed "Page X sur Y" footer, bottom-left. Numbering restarts on each
 * <Page> element, so multi-fiche documents number each fiche independently
 * (same behaviour as the deposit fiches).
 */
export const PdfPageNumberFooter = () => (
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
)
