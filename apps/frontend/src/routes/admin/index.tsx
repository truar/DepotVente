import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/AdminLayout'
import { useLiveStats } from '@/hooks/useLiveStats'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: () => (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  ),
})

function AdminDashboard() {
  // Utiliser le hook pour recevoir les stats en temps réel
  // Mode 'polling' par défaut (compatible partout), ou 'sse' pour Server-Sent Events
  const { stats, loading, error, isConnected } = useLiveStats('polling', 5000)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement des statistiques...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Temps réel actif' : 'Déconnecté'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Utilisateurs</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {stats?.totalUsers ?? 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Dépôts en cours</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {stats?.activeDepots ?? 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Ventes du jour</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {stats?.todaySales ?? 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">CA du jour</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {stats?.todayRevenue.toFixed(2) ?? '0.00'} €
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bienvenue dans l'administration</h2>
        <p className="text-gray-600">
          Utilisez le menu de gauche pour naviguer entre les différentes sections.
        </p>
      </div>
    </div>
  )
}
