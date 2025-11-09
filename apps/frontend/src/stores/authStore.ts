import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, type User } from '@/services/auth.service'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          // Appel au service pour la connexion
          const { token } = await authService.login({ email, password })

          // Stocker le token
          set({ token })

          // Récupérer les infos de l'utilisateur
          const userData = await authService.getCurrentUser()
          set({ user: userData.payload, isAuthenticated: true })
        } catch (error) {
          console.error('Login error:', error)
          set({ user: null, token: null, isAuthenticated: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } finally {
          set({ user: null, token: null, isAuthenticated: false })
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
