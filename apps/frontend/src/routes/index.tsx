import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage.ts'

export const Route = createFileRoute('/')({
  component: App,
})

export function App() {
  const [identifier, setIdentifier] = useLocalStorage<string>('identifier')
  const [error, setError] = useState<string | undefined>(undefined)

  const handleSubmit = () => {
    if (!identifier?.trim()) {
      setError('Identifiant non valide.')
      return
    }

    setError(undefined)
    console.log('Login with identifier:', identifier)
  }

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="flex w-full max-w-md flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="text-green-600 text-4xl">📦</div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200">
              Gestion Dépot/Vente
            </h1>
          </div>

          <div className="w-full rounded-xl bg-white dark:bg-gray-800 p-8 shadow-md">
            <div className="text-center">
              <h2 className="text-gray-700 dark:text-white text-2xl font-bold pb-2">
                Bienvenue
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base pb-6">
                Veuillez entrer l'identifiant du poste pour continuer.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col w-full">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium pb-2">
                  Identifiant du poste
                </p>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    setError(undefined)
                  }}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  className={`flex w-full rounded-lg h-12 px-3 text-base
                      bg-gray-50 dark:bg-gray-900 
                      text-gray-700 dark:text-gray-200
                      border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      focus:outline-none focus:ring-2 focus:ring-green-500/50
                      transition-all duration-200`}
                  placeholder="Saisissez votre identifiant ici"
                />
                {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
              </label>

              <div className="flex pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex w-full min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-12 px-5
                      bg-green-600 hover:bg-green-700
                      text-white text-base font-bold
                      transition-colors duration-200
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <span className="truncate">Connexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-6 px-5 py-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a
            className="text-gray-500 dark:text-gray-400 text-sm hover:text-green-600 dark:hover:text-green-500 transition-colors"
            href="#"
          >
            Support
          </a>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          © 2025 Gestion Dépot/Vente
        </p>
      </footer>
    </div>
  )
}
