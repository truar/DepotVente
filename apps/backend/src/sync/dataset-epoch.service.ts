import { Inject, Injectable, type OnModuleInit } from '@nestjs/common'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'
import { PRISMA, type PrismaClient } from '../prisma/prisma.module.js'

// Identifier of this database's current lifetime, see the DatasetEpoch
// model: a single row created the first time the app boots against an empty
// database. Clients store the epoch they synced against and send it back on
// every push and delta poll (X-Dataset-Epoch); after a database reset a new
// epoch appears and the old clients are refused instead of pushing records
// the server can no longer relate to.
@Injectable()
export class DatasetEpochService implements OnModuleInit {
  private current!: string

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @InjectPinoLogger(DatasetEpochService.name)
    private readonly logger: PinoLogger,
  ) {}

  get epoch(): string {
    return this.current
  }

  async onModuleInit() {
    const existing = await this.prisma.datasetEpoch.findFirst({
      orderBy: { createdAt: 'asc' },
    })
    this.current = existing
      ? existing.id
      : (await this.prisma.datasetEpoch.create({ data: {} })).id
    this.logger.info({ datasetEpoch: this.current }, 'Dataset epoch loaded')
  }
}
