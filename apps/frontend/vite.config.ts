import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

// Build identifier sent by every client on its sync requests (X-App-Version),
// so the server log says which build a computer runs. The git sha is absent
// in the Docker build (no .git in the context); the timestamp always is.
function appVersion(): string {
  const builtAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  try {
    const sha = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    return `${sha} (${builtAt})`
  } catch {
    return builtAt
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      generatedRouteTree: './src/routeTree.gen.ts',
      // Désactiver le watcher pour éviter les erreurs EXDEV dans Docker
      disableLogging: false,
    }),
    viteReact(),
    tailwindcss(),
    // Offline app shell. Without this, a reload or a new tab on a client PC
    // while the server is unreachable gives a blank page — the data is safe in
    // IndexedDB, but the app itself is only served by the server.
    // Must come last so it sees the final emitted asset list (Tailwind's plugin
    // emits the CSS asset).
    VitePWA({
      // NOT 'autoUpdate': that compiles in a `controlling` -> location.reload()
      // listener, and a surprise reload mid-sale would wipe an in-progress form.
      // 'prompt' + a no-op onNeedRefresh (see src/main.tsx) means a new build is
      // precached silently and takes over the next time the browser is reopened.
      registerType: 'prompt',
      // We register by hand in main.tsx; 'auto' would inject registerSW.js too
      // and register twice.
      injectRegister: null,
      strategies: 'generateSW',
      // Matches the filename the runbook tells operators to look for.
      filename: 'sw.js',
      // No service worker during `pnpm dev`.
      devOptions: { enabled: false },

      // Replaces public/manifest.json, which was untouched CTA boilerplate.
      manifest: {
        id: '/',
        name: 'Bourse au ski — CMR',
        short_name: 'Bourse au ski',
        description:
          'Gestion des dépôts et des ventes de la bourse au ski (fonctionne hors ligne).',
        lang: 'fr-FR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          },
          { src: 'logo192.png', type: 'image/png', sizes: '192x192' },
          { src: 'logo512.png', type: 'image/png', sizes: '512x512' },
        ],
      },

      workbox: {
        // No default glob covers `.label`. The DYMO files are listed explicitly
        // even though **/*.js already matches them, so a later edit to the js
        // pattern cannot silently drop the render-blocking framework —
        // init-dymo.js throws if it is missing.
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webmanifest}',
          'dymo.connect.framework.js',
          'init-dymo.js',
          'article-label.label',
        ],
        // Setting this REPLACES workbox's default, so node_modules is re-listed.
        globIgnores: [
          '**/node_modules/**/*',
          'tanstack-circle-logo.png',
          'tanstack-word-logo-white.svg',
        ],

        // @react-pdf/renderer plus the base64 logo inlined in
        // src/pdf/cmr-logo.tsx exceed workbox's 2 MiB default, which skips the
        // chunk with only a build warning and 404s every PDF route offline.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,

        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/signin/,
          /^\/protected/,
          /^\/logout/,
          /^\/push/,
        ],

        cleanupOutdatedCaches: true,
        // Offline-capable after one page load instead of two.
        clientsClaim: true,
        // The hinge of the no-surprise-reload behaviour: a new worker waits
        // until every tab of this origin is closed.
        skipWaiting: false,

        // Deliberately empty. NEVER add a rule matching /api: a cached
        // /api/sync/delta would serve a stale cursor and desync that client.
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 15173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
