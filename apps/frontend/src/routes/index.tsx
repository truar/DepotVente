import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { Button } from '@/components/ui/button.tsx'

export const Route = createFileRoute('/')({
  component: App,
})

export function App() {
  const [workstation, setWorkstation] = useWorkstation()
  const [localWorkstation, setLocalWorkstation] = useState<string>('')
  const [error, setError] = useState<string | undefined>(undefined)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!workstation) {
      setError('Identifiant non valide.')
      return
    }
    setWorkstation(parseInt(localWorkstation))
    setError(undefined)
    await navigate({
      to: '/depot-vente',
    })
  }

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="text-green-600 text-4xl">📦</div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestion Dépot/Vente
          </h1>
        </div>

        <div className="w-full rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
          <div className="text-center">
            <h2 className="text-gray-800 text-2xl font-bold pb-2">Bienvenue</h2>
            <p className="text-gray-600 text-base pb-6">
              Veuillez entrer l'identifiant du poste pour continuer.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col w-full">
              <p className="text-gray-700 text-sm font-medium pb-2">
                Identifiant du poste
              </p>
              <input
                type="text"
                value={localWorkstation}
                onChange={(e) => {
                  setLocalWorkstation(e.target.value)
                  setError(undefined)
                }}
                onKeyPress={handleKeyPress}
                autoFocus
                className={`flex w-full rounded-lg h-12 px-3 text-base
                      bg-gray-50
                      text-gray-800
                      border ${error ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}
                      placeholder:text-gray-400
                      focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400
                      transition-all duration-200`}
                placeholder="Saisissez votre identifiant ici"
              />
              {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
            </label>

            <div className="flex pt-6">
              <Button type="button" onClick={handleSubmit}>
                Connexion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
