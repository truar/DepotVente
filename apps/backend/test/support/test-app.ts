import { Writable } from 'node:stream'
import { randomUUID } from 'node:crypto'
import { buildApp, type App } from '../../src/app.js'

export type LogLine = Record<string, unknown> & {
  level: number
  msg?: string
  reqId?: string
}

export type TestApp = {
  app: App
  epoch: string
  token: string
  // Every log line the app wrote, parsed. A real pino logger writing to an
  // in-memory stream: what the tests read is exactly what production logs.
  logs: LogLine[]
  // Headers of a well-behaved client: token, identity, current epoch.
  // Override or drop any of them to build a misbehaving one.
  headers: (overrides?: Record<string, string | undefined>) => Record<string, string>
}

export const CLIENT = {
  deviceId: 'device-under-test',
  workstation: '4',
  appVersion: 'test-build',
}

// Boots the real application (all plugins, real database) without opening a
// port. Requests go through `app.inject()`, Fastify's built-in HTTP
// simulation: the same routing, hooks, validation and serialization as a
// socket, minus the socket.
export async function createTestApp(): Promise<TestApp> {
  const logs: LogLine[] = []
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      for (const line of chunk.toString().split('\n')) {
        if (line.trim()) logs.push(JSON.parse(line))
      }
      callback()
    },
  })

  const app = await buildApp({
    logger: { level: 'info', stream },
    jwtSecret: 'test-secret',
  })
  await app.ready()

  const token = app.jwt.sign({
    payload: { id: randomUUID(), role: 'ADMIN' },
  })
  const epoch = app.datasetEpoch

  const headers: TestApp['headers'] = (overrides = {}) => {
    const all: Record<string, string | undefined> = {
      authorization: `Bearer ${token}`,
      'x-device-id': CLIENT.deviceId,
      'x-workstation': CLIENT.workstation,
      'x-app-version': CLIENT.appVersion,
      'x-dataset-epoch': epoch,
      ...overrides,
    }
    return Object.fromEntries(
      Object.entries(all).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    )
  }

  return { app, epoch, token, logs, headers }
}

export function contact(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    lastName: 'Durand',
    firstName: 'Camille',
    phoneNumber: '0600000000',
    ...overrides,
  }
}

export function pushBody(
  overrides: Partial<{
    operationId: string
    collection: string
    operation: 'create' | 'update' | 'delete'
    recordId: string
    data: Record<string, unknown>
    timestamp: number
  }> = {},
) {
  const record = contact()
  return {
    operationId: randomUUID(),
    collection: 'contacts',
    operation: 'create',
    recordId: record.id,
    data: record,
    timestamp: Date.now(),
    ...overrides,
  }
}
