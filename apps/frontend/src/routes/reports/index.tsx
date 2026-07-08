import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ChevronLeft,
  Package,
  Scale,
  ShoppingCart,
  UserRound,
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

function SportShoeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 6h5.426a1 1 0 0 1 .863.496l1.064 1.823a3 3 0 0 0 1.896 1.407l4.677 1.114a4 4 0 0 1 3.074 3.89V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path d="M14 13l1-2" />
      <path d="M8 18v-1a4 4 0 0 0-4-4H3" />
      <path d="M10 12l1.5-3" />
    </svg>
  )
}

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
              Générer les bilans
            </h2>
            <p className="text-xl text-gray-600">Quel bilan éditer ?</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 max-w-3xl gap-3 mx-auto">
            <ClickableCard
              onClick={() => navigate({ to: '/reports/balance' })}
              icon={<Scale className="w-8 h-8 text-blue-600" />}
              title="Bilan de la bourse"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/summary-deposits' })}
              icon={<Package className="w-8 h-8 text-blue-600" />}
              title="Récap. dépôts"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/summary-sales' })}
              icon={<ShoppingCart className="w-8 h-8 text-blue-600" />}
              title="Récap. ventes"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/material-pro' })}
              icon={<UserRound className="w-8 h-8 text-blue-600" />}
              title="Bilan pro"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/reports/material' })}
              icon={<SportShoeIcon className="w-8 h-8 text-blue-600" />}
              title="Bilan matériel"
              variant="blue"
            />
          </div>
        </div>
      </main>
    </>
  )
}
