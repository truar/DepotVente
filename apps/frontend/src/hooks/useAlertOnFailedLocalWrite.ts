import { useEffect } from 'react'
import Dexie from 'dexie'
import { showErrorAlert } from '@/stores/errorAlertStore'

// Every save writes to this computer's IndexedDB first. When that write
// fails (disk full, site data evicted by the browser), no screen catches
// it: the save stops, nothing is recorded, and without this the volunteer
// saw nothing at all, free to leave believing it was saved.
//
// Mounted once, on the root route: the failure arrives as a promise
// rejection nobody handled, whatever the screen. Only IndexedDB errors
// (Dexie's) are turned into the alert; any other one is left to the
// browser as before. The screen keeps what was typed, to try again.
export function useAlertOnFailedLocalWrite() {
  useEffect(() => {
    const alertOnLocalWriteFailure = (event: PromiseRejectionEvent) => {
      if (!(event.reason instanceof Dexie.DexieError)) return
      event.preventDefault()
      showErrorAlert(
        "L'enregistrement a échoué sur ce poste : rien n'a été enregistré. " +
          'Réessayez ; si cela recommence, prévenez un responsable.',
        { title: 'Enregistrement impossible' },
      )
    }
    window.addEventListener('unhandledrejection', alertOnLocalWriteFailure)
    return () =>
      window.removeEventListener('unhandledrejection', alertOnLocalWriteFailure)
  }, [])
}
