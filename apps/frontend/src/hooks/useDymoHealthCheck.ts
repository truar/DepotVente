import { useEffect, useState } from 'react'

const isFakeDymo = import.meta.env.VITE_FAKE_DYMO === 'true'

const getPrinters = () => {
  return window.dymo.label.framework.getPrinters()
}

const checkEnvironment = () => {
  return window.dymo.label.framework.checkEnvironment()
}
const isDymoEnabled = () => {
  const checkEnvironmentResult = checkEnvironment()
  const printers = getPrinters()

  return (
    checkEnvironmentResult.isBrowserSupported &&
    checkEnvironmentResult.isFrameworkInstalled &&
    checkEnvironmentResult.isWebServicePresent &&
    printers.length > 0 &&
    printers.some((p) => p.isConnected)
  )
}

export function useDymoHealthCheck() {
  const [isEnabled, setEnabled] = useState(isFakeDymo)
  useEffect(() => {
    if (isFakeDymo) return
    const healthCheckInterval = setInterval(() => {
      const isEnabled = isDymoEnabled()
      setEnabled(isEnabled)
    }, 10000)

    return () => clearInterval(healthCheckInterval)
  }, [])

  return { isEnabled }
}
