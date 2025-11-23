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
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button.tsx'

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

  return (
    <>
      <Button variant="link" className="cursor-pointer">
        <ChevronLeft />
        <Link to={'..'}>Retour au menu principal</Link>
      </Button>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">
              Que souhaitez-vous faire ?
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez votre mode de travail pour commencer.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
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
              description="Controler les espèces"
            />
            <ClickableCard
              onClick={() => {}}
              icon={<SearchCheck className="w-8 h-8 text-green-600" />}
              title="Pros"
              description="Réceptionner les articles"
            />
            <ClickableCard
              onClick={() => {}}
              icon={<FileBox className="w-8 h-8 text-green-600" />}
              title="Fiches dépôts"
              description="Gérer les fiches"
            />
            <ClickableCard
              onClick={() => {}}
              icon={<FileCog className="w-8 h-8 text-green-600" />}
              title="Fiches pré-dépôts"
              description="Gérer les fiches"
            />
            <ClickableCard
              onClick={() => {}}
              icon={<SquarePen className="w-8 h-8 text-green-600" />}
              title="Article"
              description="Modifier un article"
            />
          </div>
        </div>
      </main>
    </>
  )
}

type ClickableCardProps = {
  onClick: () => void
  icon: ReactNode
  title: string
  description?: string
}
function ClickableCard(props: ClickableCardProps) {
  const { onClick, icon, title, description } = props
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-12 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center group hover:scale-105 duration-200 cursor-pointer"
    >
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
      {description ?? <p className="text-foreground">{description}</p>}
    </button>
  )
}
