import { Bot } from '@/bot.ts'
import { Logger } from '@/logger'
import type { BasePlugin } from '@/plugin.ts'
import { satisfies } from 'compare-versions'
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

  loaded_plugins: { [key: string]: BasePlugin<object> } = {}
  waiting_plugins: { [key: string]: { plugin_path: string; dependencies: { [key: string]: string } } } = {}

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

  private check_dependencies(plugin_name: string, dependencies: { [key: string]: string }): boolean {
    for (const [name, version] of Object.entries(dependencies)) {
      const loaded_plugin = this.loaded_plugins[name]
      if (!loaded_plugin) {
        this.logger.ERROR(`插件 ${plugin_name} 加载失败, 缺少依赖插件 ${name}, 已加入等待队列`)
        return false
      }

      if (!satisfies(loaded_plugin.version, version)) {
        this.logger.ERROR(`插件 ${plugin_name} 加载失败, 依赖插件 ${name} 版本不匹配 (需要: ${version}, 当前: ${loaded_plugin.version})`)
        return false
      }
    }

    return true
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

    let plugin_entity: BasePlugin | undefined
    try {
      const module = await import(url.pathToFileURL(plugin_dir).toString())
      const plugin_variable = module.Plugin

      if (!plugin_variable) {
        this.logger.ERROR(`插件 ${plugin_path} 加载失败, 插件未导出 Plugin 变量`)
        return false
      }

      if (typeof plugin_variable !== 'function' || !plugin_variable.toString().includes('class')) {
        this.logger.ERROR(`插件 ${plugin_path} 加载失败, 插件不是有效的类`)
        return false
      }

      plugin_entity = new plugin_variable() as BasePlugin
      if (!plugin_entity.name || !plugin_entity.version) {
        this.logger.ERROR(`插件 ${plugin_path} 加载失败, 插件缺少必要参数`)
        return false
      }

      if (this.loaded_plugins[plugin_entity.name]) {
        this.logger.INFO(`插件 ${plugin_entity.name} 已加载, 跳过本次加载`)
        return true
      }

      // 检查依赖
      if (plugin_entity.dependencies) {
        const result = this.check_dependencies(plugin_entity.name, plugin_entity.dependencies)
        if (!result) {
          this.waiting_plugins[plugin_entity.name] = {
            plugin_path,
            dependencies: plugin_entity.dependencies,
          }
          return false
        }
      }

      // 开始加载配置文件
      const config = await this.load_config(plugin_entity.name, plugin_entity.default_config)
      plugin_entity.config = config as object

      // 执行初始化
      await plugin_entity.install?.(this, this.bot)

      // 执行事件注册
      await this.load_events(plugin_entity)
    } catch (error) {
      this.logger.ERROR(`加载插件 ${plugin_entity?.name ?? plugin_path} 失败`, error)
      return false
    }

    this.loaded_plugins[plugin_entity.name] = plugin_entity
    this.logger.SUCCESS(`插件 ${plugin_entity.name} 加载成功`)

    // 加载完成了, 检查等待队列
    if (Object.keys(this.waiting_plugins).length > 0) {
      for (const [plugin_name, waiting_plugin] of Object.entries(this.waiting_plugins)) {
        if (plugin_entity.name === plugin_name) continue
        // 检查依赖
        const result = this.check_dependencies(plugin_name, waiting_plugin.dependencies)
        if (result) {
          this.logger.INFO(`等待队列中的插件 ${plugin_name} 依赖满足, 开始加载`)
          const load_result = await this.load_plugin(waiting_plugin.plugin_path)
          // 移除等待队列
          if (load_result) delete this.waiting_plugins[plugin_name]
        }
      }
    }

    return true
  }

  async load_config(config_name: string, default_config = {}) {
    this.logger.DEBUG(`开始加载 ${config_name} 配置`)

    const config_dir = path.join(this.config.base_dir, 'config')
    if (!fs.existsSync(config_dir)) fs.mkdirSync(config_dir)

    const config_file = path.join(config_dir, `${config_name}.json`)
    if (!fs.existsSync(config_file)) fs.writeFileSync(config_file, JSON.stringify(default_config, null, 2))

    const config_text = fs.readFileSync(config_file, 'utf-8')
    let config_json: object | undefined

    try {
      config_json = JSON.parse(config_text) as object
      config_json = { ...default_config, ...config_json }
      fs.writeFileSync(config_file, JSON.stringify(default_config, null, 2))
    } catch {
      this.logger.ERROR(`配置 ${config_name} 加载失败, JSON 解析错误`)
      throw new Error(`配置 ${config_name} 加载失败, JSON 解析错误`)
    }

    this.logger.DEBUG(`配置 ${config_name} 内容:`, config_json)
    this.logger.SUCCESS(`配置 ${config_name} 加载成功`)

    return config_json
  }

  private async load_events(plugin_entity: BasePlugin) {
    for (const event of plugin_entity.events) {
      this.logger.DEBUG(`插件 ${plugin_entity.name} 注册了 ${event.type} 事件`)
      if (event.type === 'command') {
        this.bot.reg_command({ ...event, plugin_name: plugin_entity.name })
      } else {
        this.bot.reg_event({ ...event, plugin_name: plugin_entity.name })
      }
    }
  }
}
