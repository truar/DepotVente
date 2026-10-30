import { useEffect } from 'react'
import { toast } from 'sonner'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

// La saisie en cours d'un formulaire, recopiée dans le sessionStorage de
// l'onglet à chaque modification : recharger la page (pour retrouver la
// Dymo, par exemple) ne la perd plus. Propre à l'onglet, elle disparaît avec
// lui. Elle s'efface d'elle-même quand le formulaire redevient vide
// (enregistré ou annulé) ; clearFormDraft l'efface en quittant la page.
type FormDraftOptions<T> = {
  // Un brouillon qui n'est pas celui de cette fiche (autre numéro, autre
  // caisse) est jeté au lieu d'être restauré.
  belongsHere: (draft: T) => boolean
  // Rien qui vaille d'être gardé.
  isBlank: (values: T) => boolean
  onRestore?: (draft: T) => void
}

export function useFormDraft<T extends FieldValues>(
  methods: UseFormReturn<T>,
  key: string | undefined,
  options: FormDraftOptions<T>,
) {
  // Une seule fois, au montage : le brouillon est lu avant que la saisie ne
  // le réécrive.
  useEffect(() => {
    if (!key) return
    const draft = readDraft<T>(key)
    if (draft && options.belongsHere(draft)) {
      methods.reset(draft, { keepDefaultValues: true })
      options.onRestore?.(draft)
      // L'id évite le doublon du double montage de StrictMode.
      toast.info('Saisie en cours restaurée', { id: key })
    } else {
      clearFormDraft(key)
    }
    const { unsubscribe } = methods.watch((values) => {
      if (options.isBlank(values as T)) clearFormDraft(key)
      else writeDraft(key, values)
    })
    return unsubscribe
  }, [key])
}

// sessionStorage peut manquer (navigation privée stricte, quota) : le
// brouillon n'est alors qu'un confort perdu, jamais une erreur.
function readDraft<T>(key: string): T | null {
  try {
    const stored = sessionStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : null
  } catch {
    return null
  }
}

function writeDraft(key: string, values: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(values))
  } catch {
    // Voir readDraft.
  }
}

export function clearFormDraft(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Voir readDraft.
  }
}
