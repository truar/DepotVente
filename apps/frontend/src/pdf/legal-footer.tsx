import { Text, View } from '@react-pdf/renderer'

export const PdfLegalFooter = () => (
  <View
    fixed
    style={{
      position: 'absolute',
      bottom: 35,
      left: 10,
      right: 10,
      textAlign: 'center',
      fontSize: 8,
      color: '#6b7280',
      lineHeight: 1.4,
    }}
  >
    <Text>
      Maison des Associations - Rue de l'Annexion - 74150 RUMILLY - www.cmr74.fr
      {' • '}
      Siret : 448 845 636 00027
    </Text>
    <Text>
      Membre du Comité de Ski du Mont-Blanc, de la Fédération Française de Ski
      et de la Fédération Française de la Montagne et de l'Escalade
    </Text>
  </View>
)
