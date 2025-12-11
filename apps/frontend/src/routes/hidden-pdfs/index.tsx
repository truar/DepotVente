import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/hidden-pdfs/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div>
        <Link to="/hidden-pdfs/summary-deposits">Summary deposits</Link>
      </div>
      <div>
        <Link to="/hidden-pdfs/summary-return-deposits">
          Summary return deposits
        </Link>
      </div>
      <div>
        <Link to="/hidden-pdfs/deposit-cash-register-control">
          Deposit cash register control
        </Link>
      </div>
    </>
  )
}
