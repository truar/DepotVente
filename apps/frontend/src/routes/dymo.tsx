import { createFileRoute } from '@tanstack/react-router'
import { useDymo } from '@/hooks/useDymo.ts'
import PublicLayout from '@/components/PublicLayout'

export const Route = createFileRoute('/dymo')({
  component: () => (
    <PublicLayout>
      <DymoHealthCheckPage />
    </PublicLayout>
  ),
})

function DymoHealthCheckPage() {
  const dymo = useDymo()
  const isEnabled = typeof window.dymo !== 'undefined'
  const printers = isEnabled
    ? window.dymo.label.framework.getPrinters()
    : []
  return (
    <>
      <div>DYMO Enabled: {isEnabled ? 'Yes' : 'No'}</div>
      <div>DYMO Printers: {JSON.stringify(printers, null, 2)}</div>
      <button
        onClick={() =>
          dymo.print({
            code: 'TEST',
            shortCode: 'T',
            color: '',
            price: '0',
            model: 'Test',
            brand: 'Test',
            category: 'Test',
            size: 'M',
          })
        }
      >
        Print
      </button>
    </>
  )
}
