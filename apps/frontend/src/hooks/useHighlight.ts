import { useCallback, useEffect, useRef, useState } from 'react'

// L'article qui vient d'être scanné, mis en avant quelques secondes : la
// liste est triée par catégorie, pas par scan, et le bénévole doit voir
// d'un coup d'œil où la ligne est tombée. Un nouveau scan prend la place
// du précédent et relance le délai.
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
