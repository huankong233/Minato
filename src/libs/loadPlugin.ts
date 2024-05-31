import fs from 'fs-extra'
import path from 'path'
import url from 'url'
import { makeSystemLogger } from './logger.ts'

const logger = makeSystemLogger({ pluginName: 'loadPlugin' })

const loadedPlugins: string[] = []

/**
 * 加载单个插件
 * @param pluginName 插件名/插件路径+插件名
 */
export async function loadPlugin(pluginName: string) {
  if (loadedPlugins.indexOf(pluginName) !== -1) {
    return logger.SUCCESS(`插件 ${pluginName} 已加载`)
  }

  const pluginDir = path.join(baseDir, 'plugins', pluginName)
  const pluginConfigDir = path.join(pluginDir, 'config.ts')
  const pluginDefaultConfigDir = path.join(pluginDir, 'config.default.ts')
  if (!fs.existsSync(pluginDir)) return logger.ERROR(`插件 ${pluginName} 不存在`)

  if (fs.existsSync(pluginDefaultConfigDir) && !fs.existsSync(pluginConfigDir)) {
    logger.ERROR(`插件 ${pluginName} 需要配置文件`)
    return
  }

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

  loadedPlugins.push(pluginName)

  return true
}
