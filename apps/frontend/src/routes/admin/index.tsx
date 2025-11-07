import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: Admin,
})

export function Admin() {
  return <div>Admin</div>
}
