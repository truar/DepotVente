import { Module } from '@nestjs/common'
import { DatasetEpochGuard } from './dataset-epoch.guard.js'
import { DatasetEpochService } from './dataset-epoch.service.js'
import { ReplicationController } from './replication.controller.js'
import { ReplicationService } from './replication.service.js'
import { SyncController } from './sync.controller.js'

@Module({
  controllers: [SyncController, ReplicationController],
  providers: [DatasetEpochService, DatasetEpochGuard, ReplicationService],
  exports: [DatasetEpochService],
})
export class SyncModule {}
