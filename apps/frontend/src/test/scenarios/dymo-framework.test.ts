import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { waitFor } from '@/test/screen.tsx'

// The real DYMO framework of /public, as index.html loads it, in front of a
// fake DYMO service on https://127.0.0.1:41951. The screens' tests use a
// fake framework (labels.ts) that behaves like this one; these stories pin
// the behaviour of the real one that useDymo relies on, so that a new
// version of the file that changes it does not go unnoticed.
const frameworkJs = readFileSync('public/dymo.connect.framework.js', 'utf8')
const initJs = readFileSync('public/init-dymo.js', 'utf8')

const printersXml =
  '<Printers><LabelWriterPrinter><Name>DYMO LabelWriter 450</Name>' +
  '<ModelName>DYMO LabelWriter 450</ModelName><IsConnected>True</IsConnected>' +
  '<IsLocal>True</IsLocal><IsTwinTurbo>False</IsTwinTurbo>' +
  '</LabelWriterPrinter></Printers>'

// A tab of the browser, in front of the DYMO service of the computer. Until
// its certificate is accepted, the browser refuses every request to the
// service, as it does a closed port.
function aTab() {
  const service = { reachable: false }
  const { window: tab } = new JSDOM('<!doctype html><body></body>', {
    url: 'http://localhost:5173/',
    runScripts: 'outside-only',
  })
  class ServiceXhr {
    readyState = 0
    status = 0
    responseText = ''
    response = ''
    url = ''
    async = true
    onreadystatechange: (() => void) | null = null
    open(_method: string, url: string, async?: boolean) {
      this.url = url
      this.async = async !== false
    }
    setRequestHeader() {}
    getAllResponseHeaders() {
      return ''
    }
    getResponseHeader() {
      return null
    }
    abort() {}
    send() {
      const answer = () => {
        this.readyState = 4
        if (!service.reachable) return
        this.status = 200
        this.responseText = this.response = this.url.includes('GetPrinters')
          ? JSON.stringify(printersXml)
          : 'true'
      }
      if (!this.async) {
        if (!service.reachable) throw new tab.DOMException('', 'NetworkError')
        answer()
        return
      }
      setTimeout(() => {
        answer()
        this.onreadystatechange?.()
      }, 0)
    }
  }
  Object.assign(tab, { XMLHttpRequest: ServiceXhr })
  return {
    service,
    // The page loads: the framework, then init-dymo.js, which looks for
    // the service in the background.
    loadPage() {
      tab.eval(frameworkJs)
      tab.eval(initJs)
      return tab.dymo.label.framework
    },
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 100))

describe('DYMO framework: a service missed when the page loaded', () => {

  it('finds the printer once the service answers', async () => {
    const { service, loadPage } = aTab()
    service.reachable = true
    const framework = loadPage()

    await waitFor(() => expect(framework.getPrinters()).toHaveLength(1))
    expect(framework.getPrinters()[0].name).toBe('DYMO LabelWriter 450')
  })

  // Hence a reload of the tab, until now, once the certificate accepted.
  it('keeps listing no printer once the service answers, if it missed it at load', async () => {
    const { service, loadPage } = aTab()
    const framework = loadPage()
    await settle()
    expect(framework.getPrinters()).toEqual([])

    service.reachable = true

    await settle()
    expect(framework.getPrinters()).toEqual([])
  })

  // What useDymo does when it finds no printer: no reload needed.
  it('finds the printer again after a synchronous checkEnvironment()', async () => {
    const { service, loadPage } = aTab()
    const framework = loadPage()
    await settle()
    expect(framework.getPrinters()).toEqual([])
    service.reachable = true

    framework.checkEnvironment()

    expect(framework.getPrinters()[0].name).toBe('DYMO LabelWriter 450')
  })

  // Asked while the service is still out of reach, the check changes
  // nothing, and a later one still works.
  it('finds the printer at a later check if the first one came too early', async () => {
    const { service, loadPage } = aTab()
    const framework = loadPage()
    await settle()

    framework.checkEnvironment()
    expect(framework.getPrinters()).toEqual([])

    service.reachable = true
    framework.checkEnvironment()
    expect(framework.getPrinters()[0].name).toBe('DYMO LabelWriter 450')
  })
})
