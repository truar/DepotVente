import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './app.module.js'
import { configureApp } from './app.js'

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule.register(),
  // Request logging is nestjs-pino's job; Fastify's own logger would double
  // every line.
  new FastifyAdapter({ logger: false }),
  { bufferLogs: true },
)
configureApp(app)

await app.listen(parseInt(process.env.PORT || '3000'), '0.0.0.0')
