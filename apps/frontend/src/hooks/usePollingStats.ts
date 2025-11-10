import { useEffect, useState } from 'react'
import { adminService, type DashboardStats } from '@/services/admin.service'

/**
 * Hook pour récupérer les stats avec un polling régulier
 * Alternative simple au SSE, compatible partout
 */
export function usePollingStats(intervalMs: number = 5000) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchStats() {
      try {
        const data = await adminService.getDashboardStats()
        if (mounted) {
          setStats(data)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching stats:', err)
          setError(
            err instanceof Error
              ? err.message
              : 'Erreur lors du chargement des statistiques'
          )
          setLoading(false)
        }
      }
    }

    // Fetch immédiatement
    fetchStats()

    // Puis fetch à intervalles réguliers
    const interval = setInterval(fetchStats, intervalMs)

    // Cleanup
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [intervalMs])

  return { stats, loading, error }
}
