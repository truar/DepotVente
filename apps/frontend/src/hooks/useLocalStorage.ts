import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue?: T,
): [T | undefined, (value: T | undefined | null) => void] {
  const [value, setStoredValue] = useState<T | undefined>(initialValue)

  const setValue = useCallback(
    (value: T | undefined | null) => {
      if (value === undefined || value === null) {
        window.localStorage.removeItem(key)
        setStoredValue(undefined)
        return
      }
      window.localStorage.setItem(key, JSON.stringify(value))
      setStoredValue(value)
    },
    [key],
  )

  const readValue = useCallback((): T | undefined => {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  }, [key])

  useEffect(() => {
    setStoredValue(readValue())
  }, [key])

  return [value, setValue]
}
