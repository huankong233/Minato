import { makeLogger } from '@/libs/logger.js'
import proxy from 'node-global-proxy'

const logger = makeLogger({ pluginName: 'proxy' })

export default function () {
  const { proxyConfig } = global.config as { proxyConfig: proxyConfig }
  if (proxyConfig.enable) {
    proxy.default.setConfig(proxyConfig.proxy)
    proxy.default.start()
    logger.NOTICE('=====================================================')
    logger.NOTICE('代理已启动')
    logger.NOTICE('=====================================================')
  }
}
