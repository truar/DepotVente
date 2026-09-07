import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { PRISMA, type PrismaClient } from '../prisma/prisma.module.js'
import { DatasetEpochGuard } from './dataset-epoch.guard.js'
import { DatasetEpochService } from './dataset-epoch.service.js'

@Controller('sync')
export class SyncController {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly epochs: DatasetEpochService,
  ) {}

  // Health check. Also how a client learns the current epoch before its
  // first push.
  @Get('ping')
  ping() {
    return {
      status: 'ok',
      timestamp: Date.now(),
      datasetEpoch: this.epochs.epoch,
    }
  }

  // Initial sync: full data dump for a workstation. Accepted whatever epoch
  // the client holds: this is how it adopts the current one.
  @Get('initial')
  @UseGuards(JwtAuthGuard)
  async initial() {
    const syncedAt = Date.now()
    return {
      ...(await this.collections()),
      syncedAt,
      datasetEpoch: this.epochs.epoch,
    }
  }

  // Delta sync: changes since timestamp
  @Get('delta')
  @UseGuards(JwtAuthGuard, DatasetEpochGuard)
  async delta(@Query('since') since?: string) {
    const syncedAt = Date.now()

    const sinceMs = Number(since)
    if (!since || !Number.isFinite(sinceMs)) {
      throw new HttpException(
        {
          code: 'INVALID_SINCE',
          message: 'since doit être un timestamp en millisecondes',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    return {
      ...(await this.collections({ updatedAt: { gte: new Date(sinceMs) } })),
      syncedAt,
      datasetEpoch: this.epochs.epoch,
    }
  }

  private async collections(where?: { updatedAt: { gte: Date } }) {
    const [
      deposits,
      articles,
      contacts,
      sales,
      refunds,
      predeposits,
      predepositArticles,
      cashRegisterControls,
    ] = await Promise.all([
      this.prisma.deposit.findMany({ where }),
      this.prisma.article.findMany({ where }),
      this.prisma.contact.findMany({ where }),
      this.prisma.sale.findMany({ where }),
      this.prisma.refund.findMany({ where }),
      this.prisma.predeposit.findMany({ where }),
      this.prisma.predepositArticle.findMany({ where }),
      this.prisma.cashRegisterControl.findMany({ where }),
    ])
    return {
      deposits,
      articles,
      contacts,
      sales,
      refunds,
      predeposits,
      predepositArticles,
      cashRegisterControls,
    }
  }
}
