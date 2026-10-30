// What came out of the Dymo label printer. On a desk PC the DYMO service
// opens the label template, fills its fields with the article and prints
// it; here a fake framework keeps the fields of each label it was asked to
// print, so a story can read the labels back.
import { HttpResponse, http } from 'msw'
import { server } from '@/test/server.ts'

export type PrintedLabel = {
  shortCode: string
  code: string
  category: string
  description: string
  brand: string
  color: string
  size: string
  price: string
  serialNumber: string
}

const labels: Array<PrintedLabel> = []

// A label printer plugged in (or none: the DYMO service answers, but lists
// no printer).
export function givenLabelPrinter(options: { connected?: boolean } = {}) {
  const { connected = true } = options
  server.use(
    http.get('/article-label.label', () =>
      HttpResponse.text('<DieCutLabel Version="8.0"/>'),
    ),
  )
  const printer = {
    isAutoCutSupported: false,
    isConnected: true,
    isLocal: true,
    isTwinTurbo: false,
    modelName: 'DYMO LabelWriter 450',
    name: 'DYMO LabelWriter 450',
    printerType: 'LabelWriterPrinter',
  }
  window.dymo = {
    label: {
      framework: {
        getPrinters: () => (connected ? [printer] : []),
        checkEnvironment: () => ({
          errorDetails: '',
          isBrowserSupported: true,
          isFrameworkInstalled: true,
          isWebServicePresent: true,
        }),
        trace: 0,
        init: () => {},
        openLabelXml: () => {
          const fields: Record<string, string> = {}
          return {
            setObjectText: (name: string, text: string) => {
              fields[name] = text
            },
            print: () => {
              labels.push({
                shortCode: fields['ARTICLE'],
                code: fields['CODE-BARRES'],
                category: fields['NOM_MATERIEL'],
                description: fields['DESCRIPTIF'],
                brand: fields['NOM_MARQUE'],
                color: fields['couleur'],
                size: fields['TAILLE'],
                price: fields['PRIX'],
                serialNumber: fields['N° Serie'],
              })
            },
          }
        },
      },
    },
  }
}

export function printedLabels(): Array<PrintedLabel> {
  return [...labels]
}

// Between stories: no printer, nothing printed.
export function resetLabelPrinter() {
  labels.length = 0
  Reflect.deleteProperty(window, 'dymo')
}
