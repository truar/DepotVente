import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/hidden-pdfs/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Link to="/hidden-pdfs/summary-deposits">Summary deposits</Link>
}
