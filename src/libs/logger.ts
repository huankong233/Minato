import { getTime } from '@/libs/time.ts'
import clc from 'cli-color'

interface loggerParams {
  pluginName: string
  subModule?: string
  type?: 'PLUGIN' | 'SYSTEM'
}

export class Logger {
  #pluginName: string
  #subModule: string | undefined
  #type: 'PLUGIN' | 'SYSTEM'

  /**
   * 创建日志记录对象
   */
  constructor(params: loggerParams) {
    const { pluginName, subModule, type = 'PLUGIN' } = params
    this.#pluginName = pluginName
    this.#subModule = subModule
    this.#type = type
  }

  /**
   * 统一格式输出到控制台
   * @param messages
   */
  INFO(...messages: any[]) {
    this.print(clc.blue(`[INFO]`), ...messages)
  }

  /**
   * 统一格式输出到控制台
   * @param messages
   */
  SUCCESS(...messages: any[]) {
    this.print(clc.green(`[SUCCESS]`), ...messages)
  }

  /**
   * 统一格式输出到控制台
   * @param messages
   */
  ERROR(...messages: any[]) {
    this.print(clc.red(`[ERROR]`), ...messages)
  }

  /**
   * 统一格式输出到控制台
   * @param messages
   */
  DEBUG(...messages: any[]) {
    if (!debug) return
    this.print(clc.magenta(`[DEBUG]`), ...messages)
  }

  DIR(obj: any, needDebug = true, needLogDir = true) {
    if (needDebug && !debug) return
    if (needLogDir) {
      console.dir(obj, { depth: null })
    } else {
      console.log(obj)
    }
  }

  private formatMessages = (messages: any[]): string[] => {
    return messages.map((item) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item)
        } catch (_error) {
          return item
        }
      } else if (typeof item === 'object') {
        return item
      }

      return item.toString()
    })
  }

  private print(...messages: any[]) {
    if (typeof messages === 'string') messages = [messages]

    let type = `${this.#type}:${this.#pluginName}`
    if (this.#subModule) type += `${type}:${this.#subModule}`

    const log = this.formatMessages(messages)
    console.log(clc.cyan(`[${getTime()}]`), clc.blackBright(`[${type}]`), ...log)
  }
}

/**
 * 构造一个logger输出
 */
export function makeLogger(params: loggerParams) {
  return new Logger({ ...params, type: 'PLUGIN' })
}

/**
 * 构造一个系统logger输出
 */
export function makeSystemLogger(params: loggerParams) {
  return new Logger({ ...params, type: 'SYSTEM' })
}
