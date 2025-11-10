import { usePollingStats } from './usePollingStats'
import { useRealtimeStats } from './useRealtimeStats'

type LiveStatsMode = 'sse' | 'polling'

/**
 * Hook unifié pour les stats en temps réel
 * Permet de choisir entre SSE ou Polling
 */
export function useLiveStats(
  mode: LiveStatsMode = 'polling',
  pollingInterval: number = 5000
) {
  // SSE pour le temps réel (plus performant mais nécessite support navigateur)
  const sseStats = useRealtimeStats()

  // Polling pour la compatibilité (plus simple, fonctionne partout)
  const pollingStats = usePollingStats(pollingInterval)

  // Retourner les stats selon le mode choisi
  if (mode === 'sse') {
    return sseStats
  }

  return {
    ...pollingStats,
    isConnected: true, // Polling est toujours "connecté"
  }
}
