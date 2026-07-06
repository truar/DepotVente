import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ChevronLeft,
  Layers,
  PackageOpen,
  Scale,
  ShoppingCart,
  Snowflake,
} from 'lucide-react'
import { requireAdmin } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout'
import { Button } from '@/components/ui/button.tsx'
import { LogoutButton } from '@/components/LogoutButton.tsx'
import { ClickableCard } from '@/components/ClickableCard.tsx'

export const Route = createFileRoute('/reports/')({
  beforeLoad: requireAdmin,
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
      <div className="flex flex-row justify-between px-3 py-3">
        <div>
          <Button variant="link" className="cursor-pointer">
            <ChevronLeft />
            <Link to={'..'}>Retour au menu principal</Link>
          </Button>
        </div>
        <LogoutButton />
      </div>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full">
          {/* Title Section */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Générer les rapports
            </h2>
            <p className="text-xl text-gray-600">Quel rapport éditer ?</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 max-w-3xl gap-3 mx-auto">
            <ClickableCard
              onClick={() => navigate({ to: '/reports/balance' })}
              icon={<Scale className="w-8 h-8 text-blue-600" />}
              title="Bilan de la bourse"
              description="Bilan global de la bourse"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/summary-deposits' })}
              icon={<PackageOpen className="w-8 h-8 text-blue-600" />}
              title="Récap. dépôts"
              description="Dépôts / pré-dépôts par caisse"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/summary-sales' })}
              icon={<ShoppingCart className="w-8 h-8 text-blue-600" />}
              title="Récap. ventes"
              description="Ventes par caisse"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/material-pro' })}
              icon={<Layers className="w-8 h-8 text-blue-600" />}
              title="Bilan matériel pro"
              description="Matériel par fiche pro"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/material' })}
              icon={<Snowflake className="w-8 h-8 text-blue-600" />}
              title="Bilan matériel"
              description="Matériel par catégorie"
              variant="blue"
            />
          </div>
        </div>
      </main>
    </>
  )
}
