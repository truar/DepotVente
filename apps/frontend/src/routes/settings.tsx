import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db.ts'
import { Button } from '@/components/ui/button.tsx'
import { syncService } from '@/sync-service.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { useState } from 'react'
import { Field } from '@/components/ui/field.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'

export const Route = createFileRoute('/settings')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const lastSync = useLiveQuery(() => db.syncMetadata.get('lastSync'))
  const triggerInitialSync = async () => {
    await syncService.initialSync()
    return
  }
  const triggerDeltaSync = async () => {
    await syncService.deltaSync()
    return
  }
  const [incrementStart, setIncrementStart] = useState(0)
  const [workstation, setWorkstation] = useWorkstation()
  const saveWorkstation = async () => {
    setWorkstation(incrementStart)
  }
  return (
    <Page title="Paramètres">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl">Synchronisation</h2>
          <p className="text-gray-600">
            {lastSync
              ? `Dernière synchronisation = 
            ${new Date(lastSync.value as number).toLocaleString()}`
              : 'Non synchonisé'}
          </p>
          <div>
            <CustomButton type="button" onClick={triggerInitialSync}>
              Écraser la base locale avec les données du serveur
            </CustomButton>
          </div>
          <div>
            <CustomButton type="button" onClick={triggerDeltaSync}>
              Récupérer les données récentes du serveur
            </CustomButton>
          </div>
        </div>
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl">Numéro de caisse</h2>
          <p className="text-gray-600">
            Numéro de caisse en cours: {workstation?.incrementStart}
          </p>
          <div className="w-3/12">
            <Field>
              <InputGroup>
                <InputGroupInput
                  value={incrementStart}
                  onChange={(e) => setIncrementStart(Number(e.target.value))}
                />
              </InputGroup>
              <div>
                <Button onClick={saveWorkstation}>Valider</Button>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </Page>
  )
}
