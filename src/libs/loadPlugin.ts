import fs from 'fs-extra'
import path from 'path'
import url from 'url'
import { makeSystemLogger } from './logger.ts'

const logger = makeSystemLogger({ pluginName: 'loadPlugin' })

/**
 * 加载单个插件
 * @param pluginName 插件名/插件路径+插件名
 */
export async function loadPlugin(pluginName: string) {
  const pluginDir = path.join(baseDir, 'plugins', pluginName)
  if (!fs.existsSync(pluginDir)) return logger.ERROR(`插件 ${pluginName} 不存在`)

  let program
  try {
    program = await import(url.pathToFileURL(pluginDir).toString())
    if (!program.default) return logger.ERROR(`加载插件 ${pluginName} 失败，插件不存在默认导出类`)
  } catch (error) {
    logger.ERROR(`插件 ${pluginName} 导入失败`)
    logger.DEBUG(error)
    return
  }

  try {
    const plugin = new program.default()
    await plugin.init()
    logger.SUCCESS(`加载插件 ${pluginName} 成功`)
  } catch (error) {
    logger.ERROR(`加载插件 ${pluginName} 失败`)
    logger.DEBUG(error)
    return
  }

  return true
}
