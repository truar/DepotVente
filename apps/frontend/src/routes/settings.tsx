import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAdmin } from '@/lib/route-guards'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db.ts'
import { Button } from '@/components/ui/button.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { useState } from 'react'
import { Field } from '@/components/ui/field.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import { syncManager } from '@/sync-manager.ts'
import { syncService } from '@/services/sync-service.ts'

export const Route = createFileRoute('/settings')({
  beforeLoad: requireAdmin,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const lastSync = useLiveQuery(() => db.syncMetadata.get('lastSync'))
  const failedOps = useLiveQuery(
    () => db.outbox.where('status').equals('failed').sortBy('timestamp'),
    [],
    [],
  )
  const triggerInitialSync = async () => {
    await syncManager.triggerInitialSync()
    return
  }
  const triggerDeltaSync = async () => {
    await syncManager.triggerDeltaSync()
    return
  }
  const [incrementStart, setIncrementStart] = useState(0)
  const [workstation, setWorkstation] = useWorkstation()
  const saveWorkstation = async () => {
    setWorkstation(incrementStart)
  }

  return (
    <Page
      title="Paramètres"
      navigation={<Link to={'..'}>Retour au menu principal</Link>}
    >
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
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow border-2 border-red-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-600 text-white">
              EXPERT
            </span>
            <h2 className="text-2xl">Outbox — opérations échouées</h2>
          </div>
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
            Réservé aux administrateurs. Forcer une réémission peut créer des
            doublons côté serveur si l'opération avait en réalité abouti.
            N'utilisez ce bouton que si vous comprenez les conséquences.
          </p>
          {failedOps && failedOps.length === 0 ? (
            <p className="text-gray-600">Aucune opération en échec.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {failedOps?.map((op) => (
                <li
                  key={op.id}
                  className="flex items-start justify-between gap-4 border rounded p-3"
                >
                  <div className="flex flex-col text-sm">
                    <code className="text-xs text-gray-500">{op.id}</code>
                    <span>
                      {op.operation} · {op.collection} · {op.recordId}
                    </span>
                    <span className="text-gray-600">
                      tentatives : {op.retryCount}
                    </span>
                    {op.error && (
                      <span className="text-red-600">{op.error}</span>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => syncService.retry(op.id)}
                  >
                    Réessayer
                  </Button>
                </li>
              ))}
            </ul>
          )}
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
