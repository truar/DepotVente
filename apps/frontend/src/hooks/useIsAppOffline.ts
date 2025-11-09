import { useState } from 'react'

export function useIsAppOffline() {
  const [isAppOffline, setIsAppOffline] = useState(!navigator.onLine)

  window.addEventListener('online', function () {
    setIsAppOffline(false)
  })

  window.addEventListener('offline', function () {
    console.log('offline')
    setIsAppOffline(true)
  })

  return isAppOffline
}
