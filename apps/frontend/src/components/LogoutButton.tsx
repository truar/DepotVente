import { useAuthStore } from '@/stores/authStore.ts'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'

export function LogoutButton() {
  const authStore = useAuthStore()
  const navigate = useNavigate()
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
    <Button onClick={logout} className="gap-3">
      <LogOut size={20} />
      <span>Déconnexion</span>
    </Button>
  )
}
