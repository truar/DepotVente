import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
// Import the generated route tree
import { routeTree } from './routeTree.gen'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'
import { IntlProvider } from 'react-intl'
import { syncManager } from '@/sync-manager.ts'
import { offerAppUpdate } from '@/stores/appUpdateStore.ts'

syncManager.init()

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <IntlProvider locale={'fr-FR'}>
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    </IntlProvider>,
  )
}

// Service worker: production builds only (virtual:pwa-register is a no-op stub
// under `pnpm dev`). Registered after render, and deliberately without
// `immediate: true`, so precaching waits for window 'load' and never competes
// with first paint or the initial sync on the older deposit PCs.
//
// A new build downloads, precaches, and then waits: nothing reloads a till
// on its own, a cashier may be halfway through a form. onNeedRefresh shows
// the « Mettre à jour » banner (AppUpdateBanner); a click calls updateSW(),
// the only thing that sends SKIP_WAITING. The new worker then takes over
// every tab of this origin at once, and each of them reloads (below). They
// must all reload together: a tab left on the old build would ask the server
// for chunks the rebuild deleted. Untouched, the new build still takes over
// once every tab of the app is closed.
//
// The browser itself only looks for a new sw.js when a page loads, and a till
// keeps the same page open all day: without the timer below, a rebuild of the
// server went unnoticed until someone reloaded.
const UPDATE_CHECK_INTERVAL = 60_000

let swRegistration: ServiceWorkerRegistration | undefined
let updateRequested = false

// The reload is ours, not the plugin's: the plugin reloads only a tab that
// was already controlled when it loaded, which leaves out the very first
// visit and a tab loaded with Ctrl+Shift+R — they would stay on the old
// build, banner stuck on « Mise à jour… ». A controller replacing another
// one only happens through SKIP_WAITING (a controlled tab keeps the new
// worker waiting), so it means someone clicked « Mettre à jour ». A
// controller arriving in a tab that had none is the worker claiming a page
// it did not serve (first install, Ctrl+Shift+R): no reload then, unless
// this very tab asked for the update.
if ('serviceWorker' in navigator) {
  let controller = navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const replacedOlderBuild = controller !== null
    controller = navigator.serviceWorker.controller
    if (replacedOlderBuild || updateRequested) window.location.reload()
  })
}

const updateSW = registerSW({
  onNeedRefresh() {
    console.info(
      '[pwa] Nouvelle version téléchargée — proposée par le bandeau.',
    )
    offerAppUpdate(() => {
      updateRequested = true
      if (swRegistration?.waiting) {
        void updateSW()
      } else {
        // The new build took over meanwhile (every other tab was closed and
        // this one, loaded with Ctrl+Shift+R, was not controlled): there is
        // nothing left to activate, a reload lands on it.
        window.location.reload()
      }
    })
  },
  // Reloading is done by the controllerchange listener above.
  onNeedReload() {},
  onRegisteredSW(_swUrl, registration) {
    swRegistration = registration
    if (!registration) return
    setInterval(() => {
      // Still downloading the build found by the previous check.
      if (registration.installing) return
      registration.update().catch(() => {
        // Server unreachable: the app keeps running offline, the next tick
        // tries again.
      })
    }, UPDATE_CHECK_INTERVAL)
  },
  onOfflineReady() {
    console.info('[pwa] Application disponible hors ligne.')
  },
  onRegisterError(error) {
    console.error('[pwa] Échec enregistrement service worker', error)
  },
})

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
