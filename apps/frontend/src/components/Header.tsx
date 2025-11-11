import { useIsAppOffline } from '@/hooks/useIsAppOffline.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useDymoHealthCheck } from '@/hooks/useDymoHealthCheck.ts'

export default function Header() {
  const dymo = useDymoHealthCheck()
  const isAppOffline = useIsAppOffline()
  const [workstation] = useWorkstation()
  return (
    <header className="flex items-center text-white shadow-lg">
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
      <HeaderNeutralStatus text={`Numéro de poste: ${workstation?.name}`} />
    </header>
  )
}

export function HeaderSuccessStatus({ text }: { text: string }) {
  return <p className="p-1 bg-green-500 flex-1">{text}</p>
}

export function HeaderNeutralStatus({ text }: { text: string }) {
  return <p className="p-1 flex-1 text-black">{text}</p>
}

export function HeaderFailureStatus({ text }: { text: string }) {
  return <p className="p-1 bg-red-500 flex-1">{text}</p>
}
