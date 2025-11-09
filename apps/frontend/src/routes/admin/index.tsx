import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/AdminLayout'

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
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total Utilisateurs</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Dépôts en cours</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Ventes du jour</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">CA du jour</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">0 €</div>
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
