import init from './init.ts'
import plugins from './plugins.ts'
import { makeSystemLogger } from '@libs/logger.js'
import { bootstrapComplete } from '@builtInPlugins/bot/index.ts'
const logger = makeSystemLogger({ pluginName: 'bootStrap' })

await init()
await plugins()

await bootstrapComplete()
logger.SUCCESS('机器人已启动成功')
