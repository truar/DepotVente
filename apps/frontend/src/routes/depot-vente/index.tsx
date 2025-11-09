import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Package, ShoppingCart } from 'lucide-react'
import PublicLayout from '@/components/PublicLayout'

export const Route = createFileRoute('/depot-vente/')({
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

export function RouteComponent() {
  const navigate = useNavigate()

  return (
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
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Mode Dépôt Card */}
          <button
            onClick={() => navigate({ to: '/depot-vente/depot' })}
            className="bg-white rounded-2xl p-12 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center group hover:scale-105 duration-200"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Mode Dépôt
            </h3>
            <p className="text-gray-600">Enregistrer de nouveaux articles.</p>
          </button>

          {/* Mode Vente Card */}
          <button className="bg-white rounded-2xl p-12 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center group hover:scale-105 duration-200">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Mode Vente
            </h3>
            <p className="text-gray-600">Accéder à la caisse.</p>
          </button>
        </div>
      </div>
    </main>
  )
}
