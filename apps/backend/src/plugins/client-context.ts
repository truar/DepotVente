import fp from 'fastify-plugin'
import type { IncomingMessage } from 'node:http'

// Identity a client attaches to every sync request (see the frontend's
// services/client-identity.ts). All optional: an old build sends none of them.
export type ClientContext = {
  deviceId?: string
  workstation?: string
  appVersion?: string
  datasetEpoch?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    client: ClientContext
  }
}

const kClientContext = Symbol('clientContext')

type TaggedRawRequest = IncomingMessage & {
  [kClientContext]?: ClientContext
}

function parse(raw: IncomingMessage): ClientContext {
  const header = (name: string) => {
    const value = raw.headers[name]
    return Array.isArray(value) ? value[0] : value
  }
  return {
    deviceId: header('x-device-id'),
    workstation: header('x-workstation'),
    appVersion: header('x-app-version'),
    datasetEpoch: header('x-dataset-epoch'),
  }
}

// The one place the client headers are read.
//
// Fastify builds each request's logger through the child logger factory,
// before the request object, the hooks or the handler exist. Parsing the
// headers there means every line written for the request - "incoming
// request", "request completed", anything a hook or handler logs - carries
// device / workstation / appVersion without the caller doing anything. The
// parsed context is stashed on the raw request and exposed as
// `request.client` for the code that needs the values (the epoch check).
export default fp(
  async (fastify) => {
    fastify.setChildLoggerFactory(function (logger, bindings, opts, rawReq) {
      const client = parse(rawReq)
      ;(rawReq as TaggedRawRequest)[kClientContext] = client

      const { deviceId, workstation, appVersion } = client
      return logger.child(
        {
          ...bindings,
          ...(deviceId && { device: deviceId }),
          ...(workstation && { workstation }),
          ...(appVersion && { appVersion }),
        },
        opts,
      )
    })

    fastify.decorateRequest('client', {
      getter() {
        return (this.raw as TaggedRawRequest)[kClientContext] ?? {}
      },
    })
  },
  { name: 'client-context' },
)
