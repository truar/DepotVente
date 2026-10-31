import { useCallback, useEffect, useRef, useState } from 'react'

// L'article qui vient d'être scanné, mis en avant quelques secondes en tête
// de la liste : elle est triée par catégorie, pas par scan, et le bénévole
// doit le voir sans le chercher. Le délai passé, il reprend sa place dans
// le tri. Un nouveau scan prend la place du précédent et relance le délai.
export function useHighlight(duration = 3000) {
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const highlight = useCallback(
    (id: string) => {
      clearTimeout(timer.current)
      setHighlighted(id)
      timer.current = setTimeout(() => setHighlighted(null), duration)
    },
    [duration],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  return { highlighted, highlight }
}
