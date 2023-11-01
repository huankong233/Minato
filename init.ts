import path from 'path'
import fs from 'fs/promises'
import { getDir } from '@libs/getDirName.ts'
import { globalReg } from '@libs/globalReg.ts'
import { getPackage } from '@libs/loadVersion.ts'
import { makeSystemLogger } from '@libs/logger.ts'
import { deleteFolder } from '@libs/fs.ts'
import { loadPlugin } from '@libs/loadPlugin.ts'

const logger = makeSystemLogger({ pluginName: 'init' })

export default async function () {
  //修改时区
  process.env.TZ = 'Asia/Shanghai'

  // 是否启用DEBUG模式
  const isDebug = typeof process.argv.find(item => item === '--debug') !== 'undefined'
  const isDeV = typeof process.argv.find(item => item === '--dev') !== 'undefined'

  // 初始化变量
  globalReg({
    plugins: {},
    config: {},
    data: {},
    debug: isDebug || isDeV,
    dev: isDeV,
    baseDir: getDir(import.meta)
  })

  // 获取 package.json 内容
  globalReg({ packageData: await getPackage() })

  // 记录日志
  await loadPlugin('log', 'builtInPlugins')

  // 清空 temp 文件夹
  const tempDir = path.join(global.baseDir, 'temp')
  await fs
    .stat(tempDir)
    .then(async () => {
      //删除temp文件夹内的所有文件
      await deleteFolder(tempDir)
      //创建文件夹
      await fs.mkdir(tempDir)
    })
    .catch(async error => {
      if (error.toString().includes('no such file or directory')) {
        //创建文件夹
        await fs.mkdir(tempDir)
      } else {
        logger.WARNING('删除temp文件夹失败')
        logger.ERROR(error)
      }
    })
}
