import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from 'database'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { PRISMA, type PrismaClient } from '../prisma/prisma.module.js'
import type { Collection, PushDto } from './push.dto.js'

// One delegate per pushable collection. Rows are forwarded to Prisma as
// received: a record that does not fit the schema surfaces as
// PrismaClientValidationError, which the exception filter turns into
// 400 INVALID_DATA.
type Delegate = {
  create(args: { data: Record<string, unknown> }): Promise<unknown>
  update(args: {
    where: { id: string }
    data: Record<string, unknown>
  }): Promise<unknown>
}

@Injectable()
export class ReplicationService {
  private readonly delegates: Record<Collection, Delegate>

  constructor(
    @Inject(PRISMA) prisma: PrismaClient,
    @InjectPinoLogger(ReplicationService.name)
    private readonly logger: PinoLogger,
  ) {
    this.delegates = {
      deposits: prisma.deposit,
      contacts: prisma.contact,
      articles: prisma.article,
      sales: prisma.sale,
      refunds: prisma.refund,
      predeposits: prisma.predeposit,
      predepositArticles: prisma.predepositArticle,
      cashRegisterControls: prisma.cashRegisterControl,
    } as unknown as Record<Collection, Delegate>
  }

  async apply({ collection, operation, data, recordId, operationId }: PushDto) {
    const delegate = this.delegates[collection]
    const now = new Date()

    switch (operation) {
      case 'create':
        try {
          await delegate.create({
            data: { ...data, createdAt: now, updatedAt: now },
          })
        } catch (err) {
          // P2002 = unique constraint. The original push reached the DB but
          // the client never saw the 200 (network drop). Treat the retry as
          // success so the outbox can drop the operation.
          if (isKnownError(err, 'P2002')) {
            this.logger.info(
              { collection, recordId, operationId },
              'Duplicate create ignored (idempotent retry)',
            )
          } else {
            throw err
          }
        }
        break

      case 'update':
        await delegate.update({
          where: { id: recordId },
          data: { ...data, updatedAt: now },
        })
        break

      case 'delete':
        // Soft delete, by hand: the softDelete extension's delete() forwards
        // `data` to Prisma's delete, which rejects it.
        try {
          await delegate.update({
            where: { id: recordId },
            data: { deletedAt: now, updatedAt: now },
          })
        } catch (err) {
          // P2025 = no live record with this id: already deleted by an
          // earlier attempt whose response was lost. Idempotent success.
          if (isKnownError(err, 'P2025')) {
            this.logger.info(
              { collection, recordId, operationId },
              'Delete of a missing record ignored (idempotent retry)',
            )
          } else {
            throw err
          }
        }
        break
    }
  }
}

function isKnownError(err: unknown, code: string) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === code
}
