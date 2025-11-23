import { useIsAppOffline } from '@/hooks/useIsAppOffline.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useDymoHealthCheck } from '@/hooks/useDymoHealthCheck.ts'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'

export default function Header() {
  const dymo = useDymoHealthCheck()
  const isAppOffline = useIsAppOffline()
  const authStore = useAuthStore()
  const navigate = useNavigate()
  const logout = useCallback(async () => {
    await authStore.logout()
    await navigate({
      to: '/login',
    })
  }, [navigate, authStore])

  const [workstation] = useWorkstation()
  return (
    <header className="flex items-center text-white shadow-lg h-9">
      {dymo.isEnabled ? (
        <HeaderSuccessStatus text={'Dymo OK'} />
      ) : (
        <HeaderFailureStatus text={'Dymo déconnectée'} />
      )}
      {isAppOffline ? (
        <HeaderFailureStatus text={'App Offline'} />
      ) : (
        <HeaderSuccessStatus text={'App Online'} />
      )}
      <HeaderNeutralStatus
        text={`Numéro de caisse: ${workstation?.incrementStart}`}
      />
      <Button onClick={logout} className="gap-3">
        <LogOut size={20} />
        <span>Déconnexion</span>
      </Button>
    </header>
  )
}

export function HeaderSuccessStatus({ text }: { text: string }) {
  return <p className="p-1 h-full bg-green-500 flex-1">{text}</p>
}

export function HeaderNeutralStatus({ text }: { text: string }) {
  return <p className="p-1 h-full flex-1 text-black">{text}</p>
}

export function HeaderFailureStatus({ text }: { text: string }) {
  return <p className="p-1 h-full bg-red-500 flex-1">{text}</p>
}
