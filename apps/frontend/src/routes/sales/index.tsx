import {
  createFileRoute,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import {
  ChevronLeft,
  ClipboardList,
  ReceiptEuro,
  ShoppingBasket,
} from 'lucide-react'
import PublicLayout from '@/components/PublicLayout'
import { Button } from '@/components/ui/button.tsx'
import { LogoutButton } from '@/components/LogoutButton.tsx'
import { ClickableCard } from '@/components/ClickableCard.tsx'
import { useAuthStore } from '@/stores/authStore.ts'

export const Route = createFileRoute('/sales/')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

export function RouteComponent() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  if (!user)
    throw new Error(
      'User not found. This should not happen. Please report this bug.',
    )

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
              Gérer les ventes
            </h2>
            <p className="text-xl text-gray-600">Que souhaitez-vous faire ?</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 max-w-3xl gap-3 mx-auto">
            <ClickableCard
              onClick={() => navigate({ to: '/sales/add' })}
              icon={<ShoppingBasket className="w-8 h-8 text-blue-600" />}
              title="Vente"
              description="Faire une vente"
              variant="blue"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/sales/sales-control' })}
              icon={<ReceiptEuro className="w-8 h-8 text-blue-600" />}
              title="Caisse"
              description="Contrôler la caisse"
              variant="blue"
            />
            {user.role === 'ADMIN' && (
              <ClickableCard
                onClick={() => navigate({ to: '/sales/listing' })}
                icon={<ClipboardList className="w-8 h-8 text-blue-600" />}
                title="Ventes"
                description="Gérer les ventes"
                variant="blue"
              />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
