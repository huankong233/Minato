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
    logger.INFO(`插件 ${pluginName} 已加载`)
    return true
  }

  const pluginDir = path.join(baseDir, 'plugins', pluginName)
  const pluginConfigDir = path.join(pluginDir, 'config.ts')
  const pluginDefaultConfigDir = path.join(pluginDir, 'config.default.ts')
  if (!fs.existsSync(pluginDir)) {
    logger.ERROR(`插件 ${pluginName} 不存在`)
    return false
  }

  if (fs.existsSync(pluginDefaultConfigDir) && !fs.existsSync(pluginConfigDir)) {
    logger.ERROR(`插件 ${pluginName} 需要配置文件`)
    return false
  }

  const pluginIndexFile = path.join(pluginDir, 'index.ts')
  if (!fs.existsSync(pluginIndexFile)) {
    logger.ERROR(`插件 ${pluginName} 缺少入口文件`)
    return false
  }

  let program
  try {
    program = await import(url.pathToFileURL(pluginIndexFile).toString())
    if (!program.default) {
      logger.ERROR(`加载插件 ${pluginName} 失败，插件不存在默认导出类`)
      return false
    }
  } catch (error) {
    logger.ERROR(`插件 ${pluginName} 导入失败`)
    logger.ERROR(error)
    return false
  }

  if (program.enable === false) {
    logger.INFO(`插件 ${pluginName} 已禁用`)
    return false
  }

  try {
    const plugin = new program.default()
    if (plugin.regEvents) await plugin.regEvents()
    if (plugin.init) await plugin.init()
    logger.SUCCESS(`加载插件 ${pluginName} 成功`)
  } catch (error) {
    logger.ERROR(`加载插件 ${pluginName} 失败`)
    logger.ERROR(error)
    return false
  }

  loadedPlugins.push(pluginName)

  return true
}
