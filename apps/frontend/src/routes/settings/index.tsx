import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { requireAdmin } from '@/lib/route-guards'
import { db } from '@/db.ts'
import { Button } from '@/components/ui/button.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Field } from '@/components/ui/field.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import { syncManager } from '@/sync-manager.ts'
import { syncService } from '@/services/sync-service.ts'
import { getAppVersion } from '@/services/client-identity.ts'

export const Route = createFileRoute('/settings/')({
  beforeLoad: requireAdmin,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const lastSync = useLiveQuery(() => db.syncMetadata.get('lastSync'))
  const rejectedOps = useLiveQuery(
    () => db.outbox.where('status').equals('rejected').sortBy('timestamp'),
    [],
    [],
  )
  const waitingCount = useLiveQuery(
    () =>
      db.outbox.where('status').anyOf('pending', 'failed', 'syncing').count(),
    [],
    0,
  )
  const deviceId = useLiveQuery(() => db.workstation.get('deviceId'))
  const datasetEpoch = useLiveQuery(() => db.syncMetadata.get('datasetEpoch'))
  const triggerInitialSync = async () => {
    await syncManager.triggerInitialSync()
    return
  }
  const triggerDeltaSync = async () => {
    await syncManager.triggerDeltaSync()
    return
  }
  const [workstation, setWorkstation] = useWorkstation()
  // Saisie gardée sous forme de texte : passer par Number() à chaque frappe
  // transforme la moindre touche non numérique en NaN, que React réaffiche
  // dans le champ — et plus rien n'est saisissable ensuite.
  const [incrementStart, setIncrementStart] = useState<string | null>(null)
  const incrementStartValue =
    incrementStart ?? String(workstation.incrementStart)
  const saveWorkstation = async () => {
    if (incrementStartValue === '') return
    setWorkstation(Number(incrementStartValue))
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
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl">Identité du poste</h2>
          <p className="text-gray-600">
            Ces informations accompagnent chaque échange avec le serveur et
            apparaissent dans ses journaux.
          </p>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-gray-500">Identifiant du poste</dt>
            <dd>
              <code>{String(deviceId?.value ?? '—')}</code>
            </dd>
            <dt className="text-gray-500">Version de l'application</dt>
            <dd>
              <code>{getAppVersion()}</code>
            </dd>
            <dt className="text-gray-500">Epoch de la base serveur</dt>
            <dd>
              <code>{String(datasetEpoch?.value ?? '—')}</code>
            </dd>
            <dt className="text-gray-500">Opérations en attente d'envoi</dt>
            <dd>{waitingCount}</dd>
          </dl>
        </div>
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow border-2 border-red-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-600 text-white">
              EXPERT
            </span>
            <h2 className="text-2xl">Outbox — opérations refusées</h2>
          </div>
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
            Opérations que le serveur a refusées ou qui ont épuisé leurs
            tentatives. Elles ne seront plus renvoyées automatiquement. Réservé
            aux administrateurs : forcer une réémission peut créer des doublons
            côté serveur si l'opération avait en réalité abouti. N'utilisez ce
            bouton que si vous comprenez les conséquences.
          </p>
          {rejectedOps.length === 0 ? (
            <p className="text-gray-600">Aucune opération refusée.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rejectedOps.map((op) => (
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
                      {new Date(op.timestamp).toLocaleString('fr-FR')} ·
                      tentatives : {op.retryCount}
                      {op.errorCode && ` · ${op.errorCode}`}
                      {op.httpStatus && ` (HTTP ${op.httpStatus})`}
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
                  value={incrementStartValue}
                  inputMode="numeric"
                  autoComplete="off"
                  onChange={(e) =>
                    setIncrementStart(e.target.value.replace(/\D/g, ''))
                  }
                />
              </InputGroup>
              <div>
                <Button
                  onClick={saveWorkstation}
                  disabled={incrementStartValue === ''}
                >
                  Valider
                </Button>
              </div>
            </Field>
          </div>
        </div>
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl">Impression des chèques</h2>
          <p className="text-gray-600">
            Réglez la position des champs imprimés sur les chèques pour cette
            imprimante.
          </p>
          <div>
            <Link to="/settings/check-print">
              <CustomButton type="button">
                Configurer l'impression des chèques
              </CustomButton>
            </Link>
          </div>
        </div>
      </div>
    </Page>
  )
}
