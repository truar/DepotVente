import {
  Module,
  RequestMethod,
  ValidationPipe,
  type DynamicModule,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import type { DestinationStream, Level } from 'pino'
import { AuthModule } from './auth/auth.module.js'
import { ClientContextMiddleware } from './client-context/client-context.middleware.js'
import { AllExceptionsFilter } from './common/all-exceptions.filter.js'
import { HealthModule } from './health/health.module.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { SyncModule } from './sync/sync.module.js'

export type AppOptions = {
  logger?: { level?: Level; stream?: DestinationStream }
  jwtSecret?: string
}

@Module({})
export class AppModule implements NestModule {
  static register(options: AppOptions = {}): DynamicModule {
    const level = options.logger?.level ?? (process.env.LOG_LEVEL as Level) ?? 'info'
    const pinoHttp = { level }

    return {
      module: AppModule,
      imports: [
        // First: its middleware creates the request logger the client
        // context middleware then enriches.
        LoggerModule.forRoot({
          pinoHttp: options.logger?.stream
            ? [pinoHttp, options.logger.stream]
            : pinoHttp,
          // Fields passed to PinoLogger.assign() also reach pino-http's
          // "request completed" line.
          assignResponse: true,
        }),
        PrismaModule,
        AuthModule.register({
          jwtSecret:
            options.jwtSecret ?? process.env.JWT_SECRET ?? 'supersecret',
        }),
        SyncModule,
        HealthModule,
      ],
      providers: [
        {
          provide: APP_PIPE,
          useValue: new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
          }),
        },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClientContextMiddleware)
      .forRoutes({ path: '{/*splat}', method: RequestMethod.ALL })
  }
}
