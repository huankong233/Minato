import type { allEvents } from '@/global.js'
import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger, type Logger } from '@/libs/logger.ts'

export class BasePlugin {
  events: allEvents[] = []
  logger: Logger

  constructor() {
    this.logger = makeLogger({ pluginName: this.constructor.name })
  }

  regEvents() {
    this.events.forEach((event) => eventReg({ ...event, pluginName: this.constructor.name }))
  }
}
