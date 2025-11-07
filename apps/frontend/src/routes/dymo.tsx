import { createFileRoute } from '@tanstack/react-router'
import { useDymo } from '@/hooks/useDymo.ts'

export const Route = createFileRoute('/dymo')({
  component: DymoHealthCheckPage,
})

function DymoHealthCheckPage() {
  const dymo = useDymo()
  return (
    <>
      <div>DYMO Enabled: {dymo.isEnabled ? 'Yes' : 'No'}</div>
      <div>DYMO Printers: {JSON.stringify(dymo.getPrinters(), null, 2)}</div>
      <button onClick={() => dymo.print()}>Print</button>
    </>
  )
}
