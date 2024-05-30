import { getDirname } from '@/libs/getDirname.ts'
import { loadPlugin } from '@/libs/loadPlugin.ts'
import fs from 'fs-extra'
import path from 'path'

// 修改时区
process.env.TZ = 'Asia/Shanghai'

// 是否启用DEBUG模式
global.isDev = typeof process.argv.find((item) => item === '--dev') !== 'undefined'
global.baseDir = getDirname(import.meta)

// 清空缓存文件夹
fs.emptyDirSync(path.join(baseDir, 'temp'))

// 加载日志插件
loadPlugin('/builtInPlugins/log')
