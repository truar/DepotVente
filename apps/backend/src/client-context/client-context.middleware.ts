import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { ServerResponse } from 'node:http'
import { PinoLogger } from 'nestjs-pino'
import {
  clientLogBindings,
  parseClientContext,
  type ClientTaggedRequest,
} from './client-context.js'

// The one place the client headers are read. Runs right after nestjs-pino
// has created the request logger, so:
//   - `req.client` is available to anything downstream (see
//     getClientContext), the dataset epoch guard in particular;
//   - `logger.assign` adds device / workstation / appVersion to the request
//     logger and, with `assignResponse`, to pino-http's "request completed"
//     line. Every later log line of the request carries them without the
//     caller doing anything.
@Injectable()
export class ClientContextMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {}

  use(req: ClientTaggedRequest, _res: ServerResponse, next: () => void) {
    req.client = parseClientContext(req.headers)
    this.logger.assign(clientLogBindings(req.client))
    next()
  }
}
