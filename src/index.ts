import { getDirname } from '@/libs/getDirname.ts'
import { loadPlugin } from '@/libs/loadPlugin.ts'
import { makeSystemLogger } from '@/libs/logger.ts'
import fs from 'fs-extra'
import path from 'path'

const logger = makeSystemLogger({ pluginName: 'bootstrap' })

// 修改时区
process.env.TZ = 'Asia/Shanghai'

// 是否启用DEBUG模式
global.isDev = typeof process.argv.find((item) => item === '--dev') !== 'undefined'
global.baseDir = getDirname(import.meta)

// 清空缓存文件夹
fs.emptyDirSync(path.join(baseDir, 'temp'))

// 加载日志插件
await loadPlugin('/builtIn/log')
const installBotSuccess = await loadPlugin('/builtIn/bot')
if (!installBotSuccess) {
  logger.ERROR('加载插件 bot 失败')
  throw new Error('加载插件 bot 失败')
}

// 加载剩余插件
await Promise.all(
  ['builtIn', 'tools', 'pigeons'].map((pluginDir) =>
    fs
      .readdirSync(path.join(baseDir, `/plugins/${pluginDir}`))
      .map((pluginName) => loadPlugin(`/${pluginDir}/${pluginName}`))
  )
)

logger.SUCCESS('插件加载完成!')
