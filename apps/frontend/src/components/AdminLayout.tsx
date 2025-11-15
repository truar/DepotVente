import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { useAuthStore } from '@/stores/authStore'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
    { icon: Users, label: 'Utilisateurs', to: '/admin/users' },
    { icon: Package, label: 'Dépôts', to: '/admin/depots' },
    { icon: ShoppingCart, label: 'Ventes', to: '/admin/sales' },
    { icon: Settings, label: 'Paramètres', to: '/admin/settings' },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold text-gray-800">Admin</h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  activeProps={{
                    className: 'bg-blue-100 text-blue-600',
                  }}
                >
                  <item.icon size={20} />
                  {isSidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info & Logout */}
        <div className="p-4 border-t">
          {isSidebarOpen && user && (
            <div className="mb-3 p-2">
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
