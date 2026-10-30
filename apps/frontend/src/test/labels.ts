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

// Where the volunteer accepts the certificate of the DYMO service, and what
// a screen says when it finds no printer.
export const DYMO_SERVICE =
  'https://127.0.0.1:41951/DYMO/DLS/Printing/StatusConnected'
export const noDymoPrinter =
  "Aucune imprimante Dymo trouvée. Vérifier qu'elle est branchée et allumée. " +
  "Si le certificat Dymo n'a pas encore été accepté sur ce poste : ouvrir le " +
  "lien ci-dessous, accepter le certificat, puis relancer l'impression. " +
  'Inutile de recharger la page.'

// A label printer plugged in (or none: the DYMO service answers, but lists
// no printer).
//
// `missedAtLoad`: the DYMO service was out of reach when the page loaded
// (its certificate not yet accepted, or the service started after the
// browser). Like the real framework (see dymo-framework.test.ts), this one
// keeps that failure and lists no printer, even once the certificate is
// accepted, until checkEnvironment() looks for the service again.
export function givenLabelPrinter(
  options: { connected?: boolean; missedAtLoad?: boolean } = {},
) {
  const { connected = true, missedAtLoad = false } = options
  const service = { reachable: !missedAtLoad, found: !missedAtLoad }
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
        getPrinters: () => (connected && service.found ? [printer] : []),
        checkEnvironment: () => {
          if (service.reachable) service.found = true
          return {
            errorDetails: '',
            isBrowserSupported: true,
            isFrameworkInstalled: true,
            isWebServicePresent: service.reachable,
          }
        },
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
  return {
    // The volunteer opens the DYMO service in another tab and accepts its
    // certificate; the page itself is not reloaded.
    acceptCertificate() {
      service.reachable = true
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
