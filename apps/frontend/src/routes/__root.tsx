import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from '@/components/ui/sonner'
import { ErrorAlertHost } from '@/components/custom/ErrorAlertHost'
import { DatasetResetDialog } from '@/components/custom/DatasetResetDialog'
import { useIgnoreScannerShortcut } from '@/hooks/useIgnoreScannerShortcut'

function RootDocument() {
  // A scan must not also open the browser's Downloads tab.
  useIgnoreScannerShortcut()
  return (
    <>
      <Outlet />
      <Toaster position="bottom-left" />
      <ErrorAlertHost />
      <DatasetResetDialog />
      {import.meta.env.DEV && !import.meta.env.TEST && (
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      )}
    </>
  )
}

export const Route = createRootRoute({
  component: RootDocument,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page non trouvée</p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  ),
})
