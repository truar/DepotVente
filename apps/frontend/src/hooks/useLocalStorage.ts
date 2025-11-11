import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T | undefined, (value: T | undefined) => void] {
  const readValue = useCallback((): T | undefined => {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  }, [key])

  const setValue = useCallback(
    (value: T | undefined) => {
      if (value === undefined) {
        window.localStorage.removeItem(key)
        setStoredValue(undefined)
        return
      }
      window.localStorage.setItem(key, JSON.stringify(value))
      setStoredValue(value)
    },
    [key],
  )

  const [value, setStoredValue] = useState<T | undefined>(() => {
    return readValue()
  })

  useEffect(() => {
    setStoredValue(readValue())
  }, [key])

  return [value, setValue]
}
