import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import PublicLayout from '@/components/PublicLayout'

export const Route = createFileRoute('/')({
  component: () => (
    <PublicLayout>
      <App />
    </PublicLayout>
  ),
})

export function App() {
  const [, setWorkstation] = useWorkstation()
  const [localWorkstation, setLocalWorkstation] = useState<string>('')
  const [error, setError] = useState<string | undefined>(undefined)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!localWorkstation) {
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

        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Bienvenue</CardTitle>
            <CardDescription>
              Veuillez entrer l'identifiant du poste pour continuer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="workstation">Numéro du poste</Label>
                <Input
                  id="workstation"
                  type="text"
                  required
                  value={localWorkstation}
                  onChange={(e) => {
                    setLocalWorkstation(e.target.value)
                    setError(undefined)
                  }}
                  onKeyUp={handleKeyPress}
                />
                {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" onClick={handleSubmit}>
              Connexion
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
