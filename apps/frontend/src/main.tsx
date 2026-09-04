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
// We never call the returned updateSW(): that is the only thing that sends
// SKIP_WAITING. A new build therefore downloads, precaches, and then waits —
// it takes over the next time the browser is reopened, so no reload can ever
// surprise a cashier mid-form.
registerSW({
  // Belt and braces. In 'prompt' mode the plugin still attaches a
  // `controlling` -> window.location.reload() listener as soon as a new worker
  // enters "waiting" (see node_modules/vite-plugin-pwa/dist/client/build/
  // register.js). It can only fire if something sends SKIP_WAITING, which we
  // never do — but overriding it means no code path can reload a till.
  onNeedReload() {
    console.info('[pwa] Bascule de version ignorée pendant la session.')
  },
  onNeedRefresh() {
    console.info(
      '[pwa] Nouvelle version téléchargée — active à la prochaine ouverture.',
    )
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
