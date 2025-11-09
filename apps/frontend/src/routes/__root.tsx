import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Footer } from '@/components/Footer.tsx'
import Header from '@/components/Header.tsx'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <Outlet />
        <Footer />
      </div>
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
    </>
  ),
})
