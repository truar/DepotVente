import { Link, createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import { CheckPrintOffsetsForm } from '@/components/forms/CheckPrintOffsetsForm.tsx'
import { useStoredCheckPrintOffsets } from '@/hooks/useCheckPrintOffsets.ts'

export const Route = createFileRoute('/settings/check-print')({
  beforeLoad: requireAdmin,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const stored = useStoredCheckPrintOffsets()

  return (
    <Page
      title="Impression des chèques"
      navigation={<Link to="/settings">Retour aux paramètres</Link>}
    >
      {/* Le formulaire n'est monté qu'une fois les décalages lus : il part
          des valeurs enregistrées et ne les relit plus ensuite. */}
      {stored && <CheckPrintOffsetsForm stored={stored} />}
    </Page>
  )
}
