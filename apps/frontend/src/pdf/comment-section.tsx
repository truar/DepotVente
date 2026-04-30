import { Text, View } from '@react-pdf/renderer'

type Props = { comment?: string | null }

export const PdfCommentSection = ({ comment }: Props) => {
  if (!comment) return null
  return (
    <View style={{ marginTop: 10, gap: 6 }} wrap={false}>
      <Text>Commentaire:</Text>
      <Text>{comment}</Text>
    </View>
  )
}
