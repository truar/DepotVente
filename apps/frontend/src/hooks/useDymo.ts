export function useDymo() {
  const getPrinters = () => {
    return window.dymo.label.framework.getPrinters()
  }

  const checkEnvironment = () => {
    return window.dymo.label.framework.checkEnvironment()
  }

  const checkEnvironmentResult = checkEnvironment()
  const printers = getPrinters()

  const isEnabled =
    checkEnvironmentResult.isBrowserSupported &&
    checkEnvironmentResult.isFrameworkInstalled &&
    checkEnvironmentResult.isWebServicePresent &&
    printers.length > 0

  return { isEnabled, getPrinters }
}
