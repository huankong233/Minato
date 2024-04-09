import { makeLogger } from '@/libs/logger.ts'
import proxy from '@huan_kong/node-global-proxy'

const logger = makeLogger({ pluginName: 'proxy' })

export default function () {
  const { proxyConfig } = global.config as { proxyConfig: proxyConfig }
  if (proxyConfig.enable) {
    proxy.setConfig(proxyConfig.proxy)
    proxy.start()
    logger.NOTICE('代理已启动')
  }
}
