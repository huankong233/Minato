import { BasePlugin } from '@/plugins/Base.ts'
import proxy from '@huan_kong/node-global-proxy'
import { config } from './config.ts'

export const enable = config.enable

export default class Proxy extends BasePlugin {
  async init() {
    proxy.setConfig(config.proxy)
    proxy.start()
    this.logger.SUCCESS('代理已启动')
  }
}
