import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import {
  ChevronLeft,
  FileBox,
  FileCog,
  ReceiptEuro,
  SearchCheck,
  SquarePen,
  Tag,
} from 'lucide-react'
import PublicLayout from '@/components/PublicLayout'
import { useAuthStore } from '@/stores/authStore.ts'
import { Button } from '@/components/ui/button.tsx'
import { ClickableCard } from '@/components/ClickableCard.tsx'
import { LogoutButton } from '@/components/LogoutButton.tsx'

export const Route = createFileRoute('/deposits/')({
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
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Gérer les dépôts
            </h2>
            <p className="text-xl text-gray-600">Que souhaitez-vous faire ?</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 max-w-3xl gap-3 mx-auto">
            <ClickableCard
              onClick={() => navigate({ to: '/deposits/add' })}
              icon={<Tag className="w-8 h-8 text-green-600" />}
              title="Dépôt"
              description="Enregistrer des articles"
            />
            <ClickableCard
              onClick={() => {
                navigate({ to: '/deposits/cash-register-control' })
              }}
              icon={<ReceiptEuro className="w-8 h-8 text-green-600" />}
              title="Caisse"
              description="Contrôler les espèces"
            />
            <ClickableCard
              onClick={() => navigate({ to: '/deposits/pros' })}
              icon={<SearchCheck className="w-8 h-8 text-green-600" />}
              title="Pros"
              description="Réceptionner les articles"
            />
            {user.role === 'ADMIN' && (
              <>
                <ClickableCard
                  onClick={() => navigate({ to: '/deposits/listing' })}
                  icon={<FileBox className="w-8 h-8 text-green-600" />}
                  title="Fiches dépôts"
                  description="Gérer les fiches"
                />
                <ClickableCard
                  onClick={() => navigate({ to: '/deposits/predeposits' })}
                  icon={<FileCog className="w-8 h-8 text-green-600" />}
                  title="Fiches pré-dépôts"
                  description="Gérer les fiches"
                />
                <ClickableCard
                  onClick={() => navigate({ to: '/deposits/articles' })}
                  icon={<SquarePen className="w-8 h-8 text-green-600" />}
                  title="Article"
                  description="Modifier un article"
                />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
