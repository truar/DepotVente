import { Injectable, type OnModuleDestroy } from '@nestjs/common'

// A timer that records how late it actually fires. Sustained lag means the
// process is too busy to answer promptly - the symptom a load or soak test
// needs to see, and invisible from outside the process.
@Injectable()
export class EventLoopLagService implements OnModuleDestroy {
  private static readonly INTERVAL_MS = 500
  private lagMs = 0
  private last = performance.now()
  private readonly timer = setInterval(() => {
    const now = performance.now()
    this.lagMs = Math.max(0, now - this.last - EventLoopLagService.INTERVAL_MS)
    this.last = now
  }, EventLoopLagService.INTERVAL_MS).unref()

  get currentMs() {
    return this.lagMs
  }

  onModuleDestroy() {
    clearInterval(this.timer)
  }
}
