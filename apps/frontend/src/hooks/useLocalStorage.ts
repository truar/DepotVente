import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const readValue = useCallback((): T => {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  }, [key])

  const setValue = useCallback(
    (value: T) => {
      window.localStorage.setItem(key, JSON.stringify(value))
      setStoredValue(value)
    },
    [key],
  )

  const [value, setStoredValue] = useState<T>(() => {
    return readValue()
  })

  useEffect(() => {
    setStoredValue(readValue())
  }, [key])

  return [value, setValue]
}
