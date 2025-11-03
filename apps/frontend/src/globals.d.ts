type PrinterInfo = {
  isAutoCutSupported: boolean
  isConnected: boolean
  isLocal: boolean
  isTwinTurbo: boolean
  modelName: string
  name: string
  printerType: string
}

type CheckEnvironmentResult = {
  errorDetails: string
  isBrowserSupported: boolean
  isFrameworkInstalled: boolean
  isWebServicePresent: boolean
}

declare global {
  interface Window {
    dymo: {
      label: {
        framework: {
          getPrinters: () => PrinterInfo[]
          checkEnvironment: () => CheckEnvironmentResult
        }
      }
    }
  }
}

window.dymo = window.dymo || {}

export {}
