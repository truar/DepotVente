import { useEffect, useRef, useState } from 'react'
import type { DepositWithRelations, PaginatedResponse } from '@cmr-apps/types'
import { useAuthStore } from '@/stores/authStore'

/**
 * Hook pour recevoir les dépôts en temps réel via Server-Sent Events (SSE)
 */
export function useRealtimeDeposits(page: number = 1, pageSize: number = 50) {
  const [deposits, setDeposits] = useState<PaginatedResponse<DepositWithRelations> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const token = useAuthStore((state) => state.token)

  const abortControllerRef = useRef<AbortController | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setError('Non authentifié')
      setLoading(false)
      return
    }

    isUnmountedRef.current = false

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const url = `${apiUrl}/api/admin/deposits/stream?page=${page}&pageSize=${pageSize}`

    const connectSSE = async (retryCount = 0) => {
      if (isUnmountedRef.current) return

      // Créer un nouveau AbortController pour cette connexion
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`Erreur de connexion SSE: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('Pas de reader disponible')
        }

        setIsConnected(true)
        setLoading(false)
        setError(null)

        let buffer = ''

        // Lire le stream
        while (true) {
          const { done, value } = await reader.read()

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (done || isUnmountedRef.current) {
            setIsConnected(false)
            break
          }

          // Ajouter le nouveau chunk au buffer
          buffer += decoder.decode(value, { stream: true })

          // Traiter les lignes complètes
          const lines = buffer.split('\n')
          // Garder la dernière ligne incomplète dans le buffer
          buffer = lines.pop() || ''

          console.log('📦 SSE lines received:', lines)

          for (const line of lines) {
            console.log('📝 Processing line:', line)
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                console.log('📊 Deposits data received:', data)
                setDeposits(data)
              } catch (err) {
                console.error('Error parsing SSE data:', err, 'Line was:', line)
              }
            }
          }
        }

        // Si la connexion se termine normalement, tenter de se reconnecter
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!isUnmountedRef.current) {
          scheduleReconnect(retryCount)
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (isUnmountedRef.current) return

        // Ne pas logger l'erreur si c'est un abort intentionnel
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        console.error('SSE connection error:', err)
        setError(
          err instanceof Error ? err.message : 'Erreur de connexion temps réel'
        )
        setIsConnected(false)
        setLoading(false)

        // Tenter de se reconnecter avec backoff exponentiel
        scheduleReconnect(retryCount)
      }
    }

    const scheduleReconnect = (retryCount: number) => {
      if (isUnmountedRef.current) return

      // Backoff exponentiel: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountedRef.current) {
          console.log(`Reconnecting SSE (attempt ${retryCount + 1})...`)
          connectSSE(retryCount + 1)
        }
      }, delay)
    }

    connectSSE()

    // Cleanup: fermer la connexion quand le composant unmount
    return () => {
      isUnmountedRef.current = true

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [token, page, pageSize])

  return { deposits, loading, error, isConnected }
}
