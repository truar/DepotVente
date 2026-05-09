import { Text, View } from '@react-pdf/renderer'

type Props = { comment?: string | null }

export const PdfCommentSection = ({ comment }: Props) => {
  if (!comment) return null
  return (
    <View fixed wrap={false} style={{ marginTop: 10, gap: 6 }}>
      <Text>Commentaire:</Text>
      <Text>{comment}</Text>
    </View>
  )
}
