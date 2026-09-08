// Drive the application through its screens, as a volunteer would: the real
// router, the real pages, the real form; the local base underneath.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { expect } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { useAuthStore } from '@/stores/authStore'

export function signedInAs(role: 'ADMIN' | 'BENEVOLE' = 'BENEVOLE') {
  useAuthStore.setState({
    isAuthenticated: true,
    token: 'test-token',
    user: {
      id: 'user-under-test',
      email: 'benevole@test',
      password: '',
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

export async function openScreen(path: string) {
  const router = createRouter({
    routeTree,
    context: {},
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const user = userEvent.setup()
  render(<RouterProvider router={router} />)
  // The route's guards run and its data loads before anything renders.
  await waitFor(() => expect(router.state.status).toBe('idle'))
  return { user, router }
}

export type User = ReturnType<typeof userEvent.setup>

export { screen, waitFor, within }
