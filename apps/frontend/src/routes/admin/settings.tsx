import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/AdminLayout'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db.ts'
import { Button } from '@/components/ui/button.tsx'
import { syncService } from '@/sync-service.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { useState } from 'react'
import { Field } from '@/components/ui/field.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'

export const Route = createFileRoute('/admin/settings')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: () => (
    <AdminLayout>
      <SettingsPage />
    </AdminLayout>
  ),
})

function SettingsPage() {
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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Paramètres</h1>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl">Synchronization</h2>
          <p className="text-gray-600">
            {lastSync
              ? `Last sync = 
            ${new Date(lastSync.value as number).toLocaleString()}`
              : 'No sync yet'}
          </p>
          <div>
            <CustomButton type="button" onClick={triggerInitialSync}>
              Trigger new initialSync
            </CustomButton>
          </div>
          <div>
            <CustomButton type="button" onClick={triggerDeltaSync}>
              Trigger new deltaSync
            </CustomButton>
          </div>
        </div>
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl">Cash register incrementStart</h2>
          <p className="text-gray-600">
            Current incrementStart: {workstation?.incrementStart}
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
                <Button onClick={saveWorkstation}> Save</Button>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}
