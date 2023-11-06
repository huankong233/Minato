import { makeLogger } from '@/libs/logger.js'
import proxy from 'node-global-proxy'

const logger = makeLogger({ pluginName: 'proxy' })

export default function () {
  const { proxyConfig } = global.config as { proxyConfig: proxyConfig }
  if (proxyConfig.enable) {
    const NodeGlobalProxy = proxy.default
    NodeGlobalProxy.setConfig(proxyConfig.proxy)
    NodeGlobalProxy.start()
    logger.SUCCESS('代理已启动')
  }
}
