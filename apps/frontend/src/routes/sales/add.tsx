import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSalesDb } from '@/hooks/useSalesDb.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'

export const Route = createFileRoute('/sales/add')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const salesDb = useSalesDb()
  const [workstation] = useWorkstation()
  if (!workstation) return null

  const currentSaleCount = useLiveQuery(() => salesDb.count()) ?? 0
  const saleCurrentIndex = workstation.incrementStart + currentSaleCount + 1
  return (
    <Page navigation={<Link to={'..'}>Retour</Link>} title="Faire une vente">
      <SalesForm saleIndex={saleCurrentIndex} />
    </Page>
  )
}

type SalesFormProps = {
  saleIndex: number
}
function SalesForm(props: SalesFormProps) {
  const { saleIndex } = props
  return <div>{saleIndex}</div>
}
