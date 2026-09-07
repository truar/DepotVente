import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger } from 'nestjs-pino'

// Everything an application instance needs beyond its modules, shared by
// main.ts and the tests so both run the same app.
export function configureApp(app: NestFastifyApplication) {
  app.useLogger(app.get(Logger))
  app.setGlobalPrefix('api')
  app.enableCors({ origin: true })
  app.enableShutdownHooks()
  return app
}
