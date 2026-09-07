import type { FastifyChildLoggerFactory } from 'fastify/types/logger.js'
import type { IncomingMessage } from 'node:http'

// Identity a client attaches to every sync request (see the frontend's
// services/client-identity.ts). All optional: an old build sends none of them.
export type ClientContext = {
  deviceId?: string
  workstation?: string
  appVersion?: string
  datasetEpoch?: string
}

const header = (req: IncomingMessage, name: string): string | undefined => {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}

export function readClientContext(req: IncomingMessage): ClientContext {
  return {
    deviceId: header(req, 'x-device-id'),
    workstation: header(req, 'x-workstation'),
    appVersion: header(req, 'x-app-version'),
    datasetEpoch: header(req, 'x-dataset-epoch'),
  }
}

// Fastify child-logger factory: every log line emitted for a request (the
// built-in "request completed" included) carries which computer sent it.
// Without this, an error in the server log cannot be traced back to a PC.
export const clientAwareChildLogger: FastifyChildLoggerFactory = function (
  logger,
  bindings,
  opts,
  rawReq,
) {
  const { deviceId, workstation, appVersion } = readClientContext(rawReq)
  return logger.child(
    {
      ...bindings,
      ...(deviceId && { device: deviceId }),
      ...(workstation && { workstation }),
      ...(appVersion && { appVersion }),
    },
    opts,
  )
}
