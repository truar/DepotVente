import { Controller, Get } from '@nestjs/common'
import { EventLoopLagService } from './event-loop-lag.service.js'

@Controller('health')
export class HealthController {
  constructor(private readonly lag: EventLoopLagService) {}

  // Reports memory as well as liveness: container RSS drifts upward from
  // heap fragmentation even with no leak, so `docker stats` alone cannot
  // tell you whether a long run is leaking. heapUsed can.
  @Get()
  health() {
    const mem = process.memoryUsage()
    const mb = (bytes: number) => Math.round((bytes / 1048576) * 10) / 10
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMb: mb(mem.rss),
        heapUsedMb: mb(mem.heapUsed),
        heapTotalMb: mb(mem.heapTotal),
        externalMb: mb(mem.external),
      },
      eventLoopLagMs: Math.round(this.lag.currentMs * 10) / 10,
    }
  }
}
