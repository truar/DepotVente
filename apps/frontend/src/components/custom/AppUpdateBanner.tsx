import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAppUpdateStore } from '@/stores/appUpdateStore'

// Shown on every page once a new build waits on this computer. It never
// reloads by itself — a cashier may be halfway through a sale — so it stays
// until someone clicks, between two customers. It sits at the top centre,
// over the empty middle of the navigation row, so it neither covers a button
// nor pushes the page down.
export function AppUpdateBanner() {
  const apply = useAppUpdateStore((s) => s.apply)
  const [applying, setApplying] = useState(false)

  if (!apply) return null

  return (
    <div
      role="status"
      aria-label="Nouvelle version de l'application"
      className="fixed inset-x-0 top-2 z-50 mx-auto flex w-fit items-center gap-4 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 shadow"
    >
      <div className="text-sm">
        <p className="font-semibold">
          Nouvelle version de l'application disponible
        </p>
        <p className="text-gray-600">
          La page va se recharger : terminez d'abord la saisie en cours.
        </p>
      </div>
      <Button
        size="sm"
        disabled={applying}
        onClick={() => {
          setApplying(true)
          apply()
        }}
      >
        {applying ? 'Mise à jour…' : 'Mettre à jour'}
      </Button>
    </div>
  )
}
