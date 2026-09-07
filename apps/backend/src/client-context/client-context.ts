import type { IncomingHttpHeaders, IncomingMessage } from 'node:http'
import type { FastifyRequest } from 'fastify'

// Identity a client attaches to every sync request (see the frontend's
// services/client-identity.ts). All optional: an old build sends none of them.
export type ClientContext = {
  deviceId?: string
  workstation?: string
  appVersion?: string
  datasetEpoch?: string
}

export type ClientTaggedRequest = IncomingMessage & { client?: ClientContext }

export function parseClientContext(headers: IncomingHttpHeaders): ClientContext {
  const header = (name: string) => {
    const value = headers[name]
    return Array.isArray(value) ? value[0] : value
  }
  return {
    deviceId: header('x-device-id'),
    workstation: header('x-workstation'),
    appVersion: header('x-app-version'),
    datasetEpoch: header('x-dataset-epoch'),
  }
}

// Fields added to every log line of the request.
export function clientLogBindings(client: ClientContext) {
  const { deviceId, workstation, appVersion } = client
  return {
    ...(deviceId && { device: deviceId }),
    ...(workstation && { workstation }),
    ...(appVersion && { appVersion }),
  }
}

// Middleware under the Fastify adapter sees the raw Node request, so that is
// where the context is stored; guards and handlers get the Fastify request.
export function getClientContext(request: FastifyRequest): ClientContext {
  return (request.raw as ClientTaggedRequest).client ?? {}
}
