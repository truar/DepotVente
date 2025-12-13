import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { ChevronLeft, ReceiptEuro, ShoppingBasket } from 'lucide-react'
import PublicLayout from '@/components/PublicLayout'
import { useAuthStore } from '@/stores/authStore.ts'
import { Button } from '@/components/ui/button.tsx'
import { LogoutButton } from '@/components/LogoutButton.tsx'
import { ClickableCard } from '@/components/ClickableCard.tsx'

export const Route = createFileRoute('/returns/')({
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
              Gérer les retours
            </h2>
            <p className="text-xl text-gray-600">Que souhaitez-vous faire ?</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 max-w-3xl gap-3 mx-auto">
            <ClickableCard
              onClick={() => navigate({ to: '/returns/individuals' })}
              icon={<ReceiptEuro className="w-8 h-8 text-green-600" />}
              title="Particulier"
              description="Retourner les particuliers"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/returns/pros' })}
              icon={<ShoppingBasket className="w-8 h-8 text-green-600" />}
              title="Pros"
              description="Retourner les pros"
            />
          </div>
        </div>
      </main>
    </>
  )
}
