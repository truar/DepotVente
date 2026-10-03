import { v4 as uuid } from 'uuid'
import { db } from '@/db.ts'

// Headers identifying this computer on every sync request. They only feed the
// server log and the epoch check; nothing on the server depends on them.
// Worker-safe: reads Dexie only (no localStorage in a Web Worker).

let deviceIdPromise: Promise<string> | null = null

// Stable per browser profile, created on first use. Survives everything but
// clearing site data.
//
// Au premier lancement, plusieurs requêtes demandent l'identifiant en même
// temps : elles partagent la même création (promesse mémorisée), et la
// lecture-puis-écriture se fait dans une seule transaction, pour que le
// worker et la page, qui ne partagent pas la mémoire, retiennent le même.
export function getDeviceId(): Promise<string> {
  deviceIdPromise ??= readOrCreateDeviceId().catch((error: unknown) => {
    // Un échec ne doit pas rester mémorisé : la prochaine requête réessaie.
    deviceIdPromise = null
    throw error
  })
  return deviceIdPromise
}

function readOrCreateDeviceId(): Promise<string> {
  return db.transaction('rw', db.workstation, async () => {
    const stored = await db.workstation.get('deviceId')
    if (typeof stored?.value === 'string') return stored.value
    const created = uuid()
    await db.workstation.put({ key: 'deviceId', value: created })
    return created
  })
}

export function getAppVersion(): string {
  return typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
}

export async function clientHeaders(): Promise<Record<string, string>> {
  const [deviceId, workstation] = await Promise.all([
    getDeviceId(),
    db.workstation.get('incrementStart'),
  ])
  const headers: Record<string, string> = {
    'X-Device-Id': deviceId,
    'X-App-Version': getAppVersion(),
  }
  if (workstation?.value !== undefined && workstation.value !== null) {
    headers['X-Workstation'] = String(workstation.value)
  }
  return headers
}
