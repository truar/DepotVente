import { useEffect, useState } from 'react'

export function useIsAppOffline() {
  const [isAppOffline, setIsAppOffline] = useState(!navigator.onLine)

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => setIsAppOffline(false)

    const handleOffline = () => setIsAppOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isAppOffline
}
