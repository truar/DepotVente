import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/db'

export function requireAuth() {
  const { isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

export function requireAdmin() {
  requireAuth()
  const { user } = useAuthStore.getState()
  if (user?.role !== 'ADMIN') {
    throw redirect({ to: '/' })
  }
}

export async function requireAuthAndWorkstation() {
  requireAuth()
  await requireWorkstation()
}

export async function requireAdminAndWorkstation() {
  requireAdmin()
  await requireWorkstation()
}

async function requireWorkstation() {
  const ws = await db.workstation.get('incrementStart')
  const incrementStart = (ws?.value as number) ?? 0
  if (!incrementStart) {
    throw redirect({ to: '/' })
  }
}
