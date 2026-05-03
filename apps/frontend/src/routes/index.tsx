import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { BaggageClaim, Loader2, Package, ShoppingCart } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import PublicLayout from '@/components/PublicLayout'
import { ClickableCard } from '@/components/ClickableCard.tsx'
import { LogoutButton } from '@/components/LogoutButton.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { db } from '@/db.ts'
import { requireAuth } from '@/lib/route-guards'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    requireAuth()
  },
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

export function RouteComponent() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const workstationRecord = useLiveQuery(() =>
    db.workstation.get('incrementStart').then((record) => record ?? null),
  )
  const isAdmin = user?.role === 'ADMIN'
  const isLoading = workstationRecord === undefined
  const isWorkstationConfigured =
    !!workstationRecord && (workstationRecord.value as number) > 0

  return (
    <>
      <div className="flex flex-row justify-between px-3 py-3">
        {isAdmin ? <SettingsLink /> : <div />}
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

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              {!isWorkstationConfigured && (
                <div className="max-w-3xl mx-auto mb-6 rounded-lg border-2 border-amber-400 bg-amber-50 p-6 text-center">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">
                    Configuration requise
                  </h3>
                  <p className="text-amber-800">
                    Cet ordinateur n'a pas de numéro de caisse configuré.
                    Veuillez demander à un administrateur de configurer ce poste
                    avant de pouvoir utiliser l'application.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
                <ClickableCard
                  onClick={() => navigate({ to: '/deposits' })}
                  icon={<Package className="w-8 h-8 text-green-600" />}
                  title="Dépôts"
                  description="Gérer les dépots"
                  disabled={!isWorkstationConfigured}
                />
                <ClickableCard
                  onClick={() => {
                    navigate({ to: '/sales' })
                  }}
                  icon={<ShoppingCart className="w-8 h-8 text-green-600" />}
                  title="Ventes"
                  description="Gérer les ventes"
                  disabled={!isWorkstationConfigured}
                />
                <ClickableCard
                  onClick={() => {
                    navigate({ to: '/returns' })
                  }}
                  icon={<BaggageClaim className="w-8 h-8 text-green-600" />}
                  title="Retours"
                  description="Gérer les retours"
                  disabled={!isWorkstationConfigured}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
function SettingsLink() {
  return (
    <Link to={'/settings'}>
      <CustomButton variant="outline">Configuration</CustomButton>
    </Link>
  )
}
