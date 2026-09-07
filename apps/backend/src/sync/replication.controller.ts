import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { DatasetEpochGuard } from './dataset-epoch.guard.js'
import { DatasetEpochService } from './dataset-epoch.service.js'
import { PushDto } from './push.dto.js'
import { ReplicationService } from './replication.service.js'

@Controller('push')
export class ReplicationController {
  constructor(
    private readonly replication: ReplicationService,
    private readonly epochs: DatasetEpochService,
  ) {}

  @Post()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, DatasetEpochGuard)
  async push(@Body() body: PushDto) {
    await this.replication.apply(body)
    return { applied: true, datasetEpoch: this.epochs.epoch }
  }
}
