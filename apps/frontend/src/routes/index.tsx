import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { BaggageClaim, Package, ShoppingCart } from 'lucide-react'
import PublicLayout from '@/components/PublicLayout'
import { useAuthStore } from '@/stores/authStore.ts'
import { ClickableCard } from '@/components/ClickableCard.tsx'
import { LogoutButton } from '@/components/LogoutButton.tsx'

export const Route = createFileRoute('/')({
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

export function RouteComponent() {
  const navigate = useNavigate()

  return (
    <>
      <div className="flex flex-row justify-end px-3 py-3">
        <LogoutButton />
      </div>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Menu principal
            </h2>
            <p className="text-xl text-gray-600">Que souhaitez-vous faire ?</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
            <ClickableCard
              onClick={() => navigate({ to: '/deposits' })}
              icon={<Package className="w-8 h-8 text-green-600" />}
              title="Dépôt"
              description="Gérer les dépots"
            />
            <ClickableCard
              onClick={() => {
                navigate({ to: '/sales' })
              }}
              icon={<ShoppingCart className="w-8 h-8 text-green-600" />}
              title="Ventes"
              description="Gérer les ventes"
            />
            <ClickableCard
              onClick={() => {
                navigate({ to: '/returns' })
              }}
              icon={<BaggageClaim className="w-8 h-8 text-green-600" />}
              title="Retours"
              description="Gérer les retours"
            />
          </div>
        </div>
      </main>
    </>
  )
}
