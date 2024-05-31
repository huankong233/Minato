import { makeLogger, type Logger } from '@/libs/logger.ts'
import proxy from '@huan_kong/node-global-proxy'
import { config } from './config.ts'

export default class Proxy {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'proxy' })
  }

  async init() {
    if (config.enable) {
      proxy.setConfig(config.proxy)
      proxy.start()
      this.#logger.SUCCESS('代理已启动')
    }
  }
}
