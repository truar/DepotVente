import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/AdminLayout'

export const Route = createFileRoute('/admin/settings')({
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
      <SettingsPage />
    </AdminLayout>
  ),
})

function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Paramètres</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Paramètres de l'application à venir...</p>
      </div>
    </div>
  )
}
