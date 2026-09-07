import { Module } from '@nestjs/common'
import { EventLoopLagService } from './event-loop-lag.service.js'
import { HealthController } from './health.controller.js'

@Module({
  controllers: [HealthController],
  providers: [EventLoopLagService],
})
export class HealthModule {}
