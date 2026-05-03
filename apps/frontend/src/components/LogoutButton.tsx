import { useAuthStore } from '@/stores/authStore.ts'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'

export function LogoutButton() {
  const authStore = useAuthStore()
  const navigate = useNavigate()
  const [workstation] = useWorkstation()
  const logout = useCallback(async () => {
    try {
      await authStore.logout()
    } finally {
      await navigate({
        to: '/login',
      })
    }
  }, [navigate, authStore])

  return (
    <div className="flex items-center gap-3">
      {workstation.incrementStart > 0 && (
        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          Caisse {workstation.incrementStart}
        </span>
      )}
      <Button onClick={logout} className="gap-3">
        <LogOut size={20} />
        <span>Déconnexion</span>
      </Button>
    </div>
  )
}
