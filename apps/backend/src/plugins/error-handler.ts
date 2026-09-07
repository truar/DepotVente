import fp from 'fastify-plugin'
import type { FastifyError } from 'fastify'
import { Prisma } from 'database'

// Every error leaves the server as `{ code, message }` with a status that
// tells the client whether retrying can help:
//   4xx - the request itself is wrong; the client parks it and alerts.
//   5xx - the server or the database hiccupped; the client retries later.
// Before this handler a malformed push and a database outage both produced an
// opaque 500, so the client could only retry both, forever.
export default fp(
  async (fastify) => {
    fastify.setErrorHandler((error: FastifyError, request, reply) => {
      const { code, status, message } = classify(error)
      const context = {
        err: error,
        route: request.routeOptions.url,
        body: summarizeBody(request.body),
      }

      if (status >= 500) {
        request.log.error(context, message)
      } else {
        request.log.warn(context, message)
      }

      return reply.code(status).send({ code, message })
    })
  },
  { name: 'error-handler' },
)

function classify(error: FastifyError): {
  code: string
  status: number
  message: string
} {
  if (error.validation) {
    return {
      code: 'INVALID_PAYLOAD',
      status: 400,
      message: `Requête invalide: ${error.message}`,
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    // Unknown column, wrong type... the client's record does not fit the
    // server's schema (typically a client build older or newer than the
    // server). Prisma's message names the offending field.
    return {
      code: 'INVALID_DATA',
      status: 400,
      message: `Données refusées par le schéma: ${lastLine(error.message)}`,
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        return {
          code: 'RECORD_NOT_FOUND',
          status: 404,
          message: 'Enregistrement inconnu du serveur.',
        }
      case 'P2003':
        return {
          code: 'MISSING_REFERENCE',
          status: 409,
          message: `Référence vers un enregistrement inconnu (${String(error.meta?.field_name ?? 'clé étrangère')}).`,
        }
      case 'P2002':
        return {
          code: 'DUPLICATE',
          status: 409,
          message: 'Enregistrement déjà existant.',
        }
    }
  }

  if (error.statusCode && error.statusCode < 500) {
    return {
      code: error.code ?? 'BAD_REQUEST',
      status: error.statusCode,
      message: error.message,
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    status: 500,
    message: 'Erreur interne du serveur.',
  }
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
