import { Text, View } from '@react-pdf/renderer'

const formatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  dateStyle: 'short',
  timeStyle: 'medium',
})

export const PdfTimestampFooter = () => {
  const timestamp = formatter.format(new Date())
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 8,
        color: '#9ca3af',
      }}
    >
      <Text>{timestamp}</Text>
    </View>
  )
}
