import { Logger, makeLogger } from '@/libs/logger.ts'
import { getDate } from '@/libs/time.ts'
import clc from 'cli-color'
import fs from 'fs-extra'
import path from 'path'
import { logConfig } from './config.ts'

export default class Log {
  #config: logConfig
  #logger: Logger
  #logDir: string

  constructor() {
    this.#config = {
      max: 100,
      force: false
    }
    this.#logger = makeLogger({ pluginName: 'log' })
    this.#logDir = path.join(baseDir, 'logs')
  }

  async init() {
    this.#config = (await import('./config.ts')).default
    this.rewriteConsole()
  }

  rewriteConsole() {
    if (isDev) {
      if (this.#config.force) {
        this.#logger.DEBUG(`处于DEV模式中,强制开启日志保存功能`)
      } else {
        return this.#logger.DEBUG(`处于DEV模式中,禁用日志保存功能`)
      }
    }

    console.log = ((originFunction) => {
      return (...args) => {
        this.saveLog(args)
        originFunction(...args)
      }
    })(console.log)
  }

  saveLog(args: any[]) {
    const filePath = path.join(this.#logDir, `${getDate()}.log`)

    const log = args
      .map((item) => {
        const type = typeof item
        if (type === 'string') {
          return item
        } else if (type === 'object') {
          return item.stack ?? JSON.stringify(item, null, 3)
        } else if (type === 'undefined') {
          return 'undefined'
        } else {
          return item.toString()
        }
      })
      .join(' ')

    const fileData = clc.strip(log) + '\n'
    if (!fs.existsSync(this.#logDir)) fs.mkdirSync(this.#logDir)
    if (!fs.existsSync(filePath)) this.removeUselessLogs()
    fs.appendFileSync(filePath, fileData)
  }

  removeUselessLogs() {
    // 如果不存在则当前文件夹文件数量+1是否超过max
    const files = fs.readdirSync(this.#logDir)
    if (files.length + 1 >= this.#config.max) {
      const validFiles = files.filter((file) => /^\d{4}-\d{2}-\d{2}$/.test(file)).sort()
      const filesToDelete = validFiles.length - this.#config.max
      for (let i = 0; i < filesToDelete; i++) {
        const filePath = path.join(this.#logDir, validFiles[i])
        fs.removeSync(filePath)
      }
    }
  }
}
