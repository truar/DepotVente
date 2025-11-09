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

type ILabel = {
  print: (printerName: string) => void
}

declare global {
  interface Window {
    dymo: {
      label: {
        framework: {
          getPrinters: () => PrinterInfo[]
          checkEnvironment: () => CheckEnvironmentResult
          trace: number
          init: () => void
          openLabelXml: (xml: string) => ILabel
        }
      }
    }
  }
}

window.dymo = window.dymo

export {}
