import { getDateTime } from '@/libs/time.ts'
import clc from 'cli-color'

export class Logger {
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
    this.print(clc.magenta(`[DEBUG]`), ...messages)
  }

  private formatMessages = (messages: unknown[]): string[] => {
    return messages.map((item) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item)
        } catch {
          return item
        }
      } else if (typeof item === 'object') {
        return item
      }

      return (item ?? '').toString()
    })
  }

  private print(...messages: unknown[]) {
    if (typeof messages === 'string') messages = [messages]

    const log = this.formatMessages(messages)
    console.log(clc.cyan(`[${getDateTime()}]`), ...log)
  }
}
