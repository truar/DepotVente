// Page object for the login screen (/login): the volunteer types the email
// and the password of the account, then « Se connecter ».
import { useAuthStore } from '@/stores/authStore.ts'
import { openScreen, screen } from '@/test/screen.tsx'

export async function loginPage() {
  const { user: u, router } = await openScreen('/login')
  await screen.findByText('Entrez vos identifiants')

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    async signIn(credentials: { email: string; password: string }) {
      await u.type(screen.getByLabelText('Email'), credentials.email)
      await u.type(screen.getByLabelText('Mot de passe'), credentials.password)
      await u.click(screen.getByRole('button', { name: 'Se connecter' }))
    },
  }
  return page
}

// What the browser keeps of the session, under « auth-storage ».
export function storedSession(): {
  token: string | null
  isAuthenticated: boolean
  user: { role?: string } | null
} | null {
  const raw = localStorage.getItem('auth-storage')
  return raw ? JSON.parse(raw).state : null
}

// Closing the browser and opening it again: what the app held in memory is
// gone, only what the browser stored on disk (localStorage) remains, and the
// app reads it back when it starts.
export async function reopenBrowser() {
  const kept = localStorage.getItem('auth-storage')
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  if (kept === null) localStorage.removeItem('auth-storage')
  else localStorage.setItem('auth-storage', kept)
  await useAuthStore.persist.rehydrate()
}

// A computer nobody has signed in on yet.
export function signedOut() {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  localStorage.clear()
}
