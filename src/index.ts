import { version } from '@/../package.json'
import { getDirname } from '@/libs/getDirname.ts'
import { loadPlugin } from '@/libs/loadPlugin.ts'
import { makeSystemLogger } from '@/libs/logger.ts'
import { Command } from 'commander'
import fs from 'fs-extra'
import path from 'path'

const logger = makeSystemLogger({ pluginName: 'bootstrap' })

const opts = new Command()
  .name('kkbot')
  .description('A simple qqbot based on node-napcat-ts')
  .version(version)
  .option('-D, --debug', 'run in debug mode', false)
  .option('-TZ, --timezone', 'specify the timezone', 'Asia/Shanghai')
  .allowExcessArguments(true)
  .allowUnknownOption(true)
  .parse()
  .opts()

// 修改时区
process.env.TZ = opts.timezone

// 是否启用DEBUG模式
global.debug = opts.debug
global.baseDir = getDirname(import.meta)

// 清空缓存文件夹
fs.emptyDirSync(path.join(baseDir, 'temp'))

// 加载日志插件
await loadPlugin('/BuiltIn/Log')
const installBotSuccess = await loadPlugin('/BuiltIn/Bot')
if (!installBotSuccess) {
  logger.ERROR('加载插件 bot 失败')
  throw new Error('加载插件 bot 失败')
}

// 加载剩余插件
const plugins = ['BuiltIn', 'Tools', 'Pigeons'].flatMap((pluginDir) =>
  fs
    .readdirSync(path.join(baseDir, `/plugins/${pluginDir}`))
    .filter((pluginName) => !pluginName.includes('help'))
    .flatMap((pluginName) => `/${pluginDir}/${pluginName}`)
)

for (const plugin of plugins) await loadPlugin(plugin)

// 最后加载帮助插件
await loadPlugin(`/Tools/Help`)

logger.SUCCESS('所有插件已加载完成!')
