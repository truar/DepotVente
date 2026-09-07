import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { EpochMismatch } from '@/db.ts'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { db } from '@/db.ts'
import { syncManager } from '@/sync-manager.ts'

// Shown, on every page, from the moment the server refuses this computer
// with EPOCH_MISMATCH (the server database was reset since the last sync)
// until the local base has been rebuilt from the server. Nothing pushes or
// pulls in between, so there is no point letting the operator carry on.
export function DatasetResetDialog() {
  const mismatch = useLiveQuery(() => db.syncMetadata.get('epochMismatch'))
  const unsentCount = useLiveQuery(() => db.outbox.count(), [], 0)
  const [busy, setBusy] = useState(false)

  if (!mismatch) return null
  const info = mismatch.value as EpochMismatch

  const reset = () => {
    setBusy(true)
    syncManager.resetLocal()
  }

  return (
    <AlertDialog open>
      <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            La base de données du serveur a été réinitialisée
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ce poste s'est synchronisé avec une ancienne version de la base du
            serveur (détecté le{' '}
            {new Date(info.detectedAt).toLocaleString('fr-FR')}). La
            synchronisation est suspendue tant que les données locales n'ont pas
            été rechargées depuis le serveur.
          </AlertDialogDescription>
          {unsentCount > 0 && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
              {unsentCount === 1
                ? "Une opération saisie sur ce poste n'a pas pu être transmise et sera perdue."
                : `${unsentCount} opérations saisies sur ce poste n'ont pas pu être transmises et seront perdues.`}
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={reset} disabled={busy}>
            {busy ? 'Rechargement…' : 'Recharger depuis le serveur'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
