import { useCallback, useState } from 'react'

// Choisir dans la liste de recherche ouvre aussitôt ce qui est choisi. Si
// autre chose est déjà ouvert, on demande d'abord confirmation : un mauvais
// clic ne doit pas fermer le pro ou la fiche en cours. Rechoisir ce qui est
// déjà ouvert ne fait rien.
//
// `request` se branche sur la liste ; `confirmation` se passe tel quel à
// ConfirmationDialog, avec le titre propre à l'écran.
export function useAskBeforeSwitching(
  current: string | null,
  open: (id: string) => void,
) {
  const [requested, setRequested] = useState<string | null>(null)

  const request = useCallback(
    (id: string) => {
      if (!id || id === current) return
      if (current) {
        setRequested(id)
        return
      }
      open(id)
    },
    [current, open],
  )

  const confirmation = {
    open: requested !== null,
    onOpenChange: (isOpen: boolean) => {
      if (!isOpen) setRequested(null)
    },
    onConfirm: () => {
      if (requested) open(requested)
    },
  }

  return { request, confirmation }
}
