import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from 'database'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'

// Every error leaves the server as `{ code, message }` with a status that
// tells the client whether retrying can help:
//   4xx - the request itself is wrong; the client parks it and alerts.
//   5xx - the server or the database hiccupped; the client retries later.
export type ErrorBody = { code: string; message: string } & Record<
  string,
  unknown
>

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp()
    const request = http.getRequest<FastifyRequest>()
    const reply = http.getResponse<FastifyReply>()

    const { status, body } = classify(exception)
    const context = {
      err: exception,
      route: request.routeOptions.url ?? request.url,
      body: summarizeBody(request.body),
    }

    if (status >= 500) {
      this.logger.error(context, body.message)
    } else {
      this.logger.warn(context, body.message)
    }

    return reply.status(status).send(body)
  }
}

function classify(exception: unknown): { status: number; body: ErrorBody } {
  if (exception instanceof HttpException) {
    return fromHttpException(exception)
  }

  if (exception instanceof Prisma.PrismaClientValidationError) {
    // Unknown column, wrong type... the client's record does not fit the
    // server's schema (typically a client build older or newer than the
    // server). Prisma's message names the offending field.
    return {
      status: HttpStatus.BAD_REQUEST,
      body: {
        code: 'INVALID_DATA',
        message: `Données refusées par le schéma: ${lastLine(exception.message)}`,
      },
    }
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: {
            code: 'RECORD_NOT_FOUND',
            message: 'Enregistrement inconnu du serveur.',
          },
        }
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          body: {
            code: 'MISSING_REFERENCE',
            message: `Référence vers un enregistrement inconnu (${String(exception.meta?.field_name ?? 'clé étrangère')}).`,
          },
        }
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          body: { code: 'DUPLICATE', message: 'Enregistrement déjà existant.' },
        }
    }
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur.' },
  }
}

function fromHttpException(exception: HttpException): {
  status: number
  body: ErrorBody
} {
  const status = exception.getStatus()
  const response = exception.getResponse()

  // Our own guards throw with a ready-made body (code, message, extras).
  if (isErrorBody(response)) {
    return { status, body: response }
  }

  // Nest's built-in exceptions: `{ statusCode, message, error }`, where the
  // ValidationPipe's message is the list of constraint violations.
  const message =
    typeof response === 'object' && response !== null && 'message' in response
      ? (response as { message: unknown }).message
      : exception.message

  if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
    return {
      status,
      body: {
        code: 'INVALID_PAYLOAD',
        message: `Requête invalide: ${message.join('; ')}`,
      },
    }
  }

  return {
    status,
    body: {
      code: DEFAULT_CODES[status] ?? `HTTP_${status}`,
      message: String(message),
    },
  }
}

const DEFAULT_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
}

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ErrorBody).code === 'string' &&
    typeof (value as ErrorBody).message === 'string'
  )
}

// Prisma validation messages are multi-line with a query dump; only the last
// line says what is wrong.
function lastLine(text: string): string {
  const lines = text.trim().split('\n')
  return lines[lines.length - 1].trim()
}

// Enough to find the record in the client's outbox, without dumping the
// whole payload into the log.
function summarizeBody(body: unknown) {
  if (!body || typeof body !== 'object') return undefined
  const { operationId, collection, operation, recordId } = body as Record<
    string,
    unknown
  >
  return { operationId, collection, operation, recordId }
}
