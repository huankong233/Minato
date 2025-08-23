import { Bot } from '@/bot.ts'
import { Logger } from '@/logger'
import type { BasePlugin } from '@/utils.ts'
import type { NCWebsocketOptions } from 'node-napcat-ts'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

export type MinatoConfig = NCWebsocketOptions & { base_dir: string }

export class Minato {
  logger: Logger

  config: MinatoConfig
  debug: boolean

  bot: Bot
  loaded_plugins: string[] = []

  protected constructor(config: MinatoConfig, debug: boolean, bot: Bot) {
    this.logger = new Logger('Minato', debug)

    this.config = config
    this.debug = debug
    this.bot = bot

    this.logger.SUCCESS(`Minato 初始化完成`)
  }

  static async init(config: MinatoConfig, debug = false) {
    const logger = new Logger('Minato', debug)
    logger.DEBUG(`初始化 Minato 实例`)
    logger.DEBUG(`配置信息:`, config)

    const bot = await Bot.init(config, debug)

    return new Minato(config, debug, bot)
  }

  async load_plugin(plugin_path: string): Promise<boolean> {
    this.logger.DEBUG(`开始加载 ${plugin_path} 插件`)

    let plugin_dir = path.join(this.config.base_dir, plugin_path)
    this.logger.DEBUG(`插件目录: ${plugin_dir}`)

    if (!fs.existsSync(plugin_dir)) {
      // 加载 .ts 判断是否存在
      const plugin_file = `${plugin_dir}.ts`
      this.logger.DEBUG(`插件非文件夹插件, 尝试为单文件插件`)
      this.logger.DEBUG(`新插件目录: ${plugin_file}`)

      if (!fs.existsSync(plugin_file)) {
        this.logger.ERROR(`插件 ${plugin_file} 入口文件不存在`)
        return false
      }

      plugin_dir = plugin_file
    }

    let plugin: BasePlugin | undefined
    try {
      const module = await import(url.pathToFileURL(plugin_dir).toString())
      if (!module.default) {
        this.logger.ERROR(`插件 ${plugin_path} 加载失败, 插件不存在默认导出类`)
        return false
      }

      if (typeof module.default !== 'function' || !module.default.toString().includes('class')) {
        this.logger.ERROR(`插件 ${plugin_path} 加载失败, 插件不是有效的类`)
        return false
      }

      plugin = new module.default() as BasePlugin
      if (!plugin.name || !plugin.version) {
        this.logger.ERROR(`插件 ${plugin_path} 加载失败, 插件缺少必要参数`)
        return false
      }

      if (this.loaded_plugins.includes(plugin.name)) {
        this.logger.INFO(`插件 ${plugin.name} 已加载`)
        return true
      }
    } catch (error) {
      this.logger.ERROR(`加载插件 ${plugin?.name ?? plugin_path} 失败`, error)
      return false
    }

    this.loaded_plugins.push(plugin.name)

    this.logger.SUCCESS(`插件 ${plugin.name} 加载成功`)
    return true
  }

  // load_config(config_name: string) {
  //   this.logger.DEBUG(`开始加载 ${config_name} 配置`)
  //   this.logger.SUCCESS(`配置 ${config_name} 加载成功`)
  // }
}
