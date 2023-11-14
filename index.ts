import { makeSystemLogger } from '@/libs/logger.js'
import init from './init.ts'
import plugins from './plugins.ts'

const logger = makeSystemLogger({ pluginName: 'bootStrap' })

await init()
await plugins()

logger.SUCCESS('机器人已启动成功')
