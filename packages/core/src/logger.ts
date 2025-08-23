import { getDateTime } from '@/utils.ts'
import clc from 'cli-color'

export class Logger {
  prefix: string
  debug: boolean

  constructor(prefix: string, debug = false) {
    this.prefix = prefix
    this.debug = debug
  }

  INFO(...messages: unknown[]) {
    this.print(clc.blue(`[INFO]`), ...messages)
  }

  SUCCESS(...messages: unknown[]) {
    this.print(clc.green(`[SUCCESS]`), ...messages)
  }

  ERROR(...messages: unknown[]) {
    this.print(clc.red(`[ERROR]`), ...messages)
  }

  DEBUG(...messages: unknown[]) {
    if (!this.debug) return
    this.print(clc.magenta(`[DEBUG]`), ...messages)
  }

  private formatMessages = (messages: unknown[]): string[] => {
    return messages.map((item) => {
      try {
        return typeof item === 'string' ? JSON.parse(item) : item
      } catch {
        return item
      }
    })
  }

  private print(...messages: unknown[]) {
    if (typeof messages === 'string') messages = [messages]

    const message = [clc.cyan(`[${getDateTime()}]`)]
    if (this.prefix) message.push(clc.yellow(`[${this.prefix}]`))
    message.push(...this.formatMessages(messages))

    console.log(...message)
  }
}
