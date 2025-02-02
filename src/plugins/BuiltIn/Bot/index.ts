import type { Command, commandEvent } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { config as BotConfig } from '@/plugins/BuiltIn/Bot/config.ts'
import clc from 'cli-color'
import type { AllHandlers } from 'node-napcat-ts'
import { convertCQCodeToJSON, convertJSONToCQCode, NCWebsocket, Structs } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Bot extends BasePlugin {
  async init() {
    return new Promise(async (resolve, reject) => {
      const bot = new NCWebsocket(config.connect)

      if (debug) {
        bot.on('api.preSend', (context) => {
          this.logger.DEBUG('发送API请求')
          this.logger.DIR(context)
        })
        bot.on('api.response.success', (context) => {
          this.logger.DEBUG('收到API成功响应')
          this.logger.DIR(context)
        })
      }

      bot.on('api.response.failure', (context) => {
        this.logger.ERROR('收到API失败响应')
        this.logger.DIR(context, false)
      })

      bot.on('socket.connecting', (context) => {
        this.logger.INFO(`连接中#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`)
      })

      bot.on('socket.error', (context) => {
        this.logger.ERROR(`连接失败#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`)
        this.logger.ERROR(context)

        if (context.reconnection.nowAttempts >= context.reconnection.attempts) {
          reject(`重试次数超过设置的${context.reconnection.attempts}次!`)
          throw new Error(`重试次数超过设置的${context.reconnection.attempts}次!`)
        }

        if (context.error_type === 'response_error') {
          reject(`napcat服务端返回错误: ${context.info.message}`)
          throw new Error(`napcat服务端返回错误: ${context.info.message}`)
        }
      })

      bot.on('socket.open', async (context) => {
        this.logger.SUCCESS(`连接成功#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`)
        await this.connectSuccess(bot)
        resolve(true)
      })

      await bot.connect()
    })
  }

  async connectSuccess(bot: NCWebsocket) {
    global.bot = bot

    this.initEvents()

    if (debug || !config.online) return
    if (config.online.to <= 0) return this.logger.INFO('未设置发送账户,请注意~')

    await sendMsg({ message_type: 'private', user_id: config.online.to }, [Structs.text(config.online.msg)])
  }

  static parseMessage(message: string, needReply = false): Command | false {
    if (needReply) {
      const json = convertCQCodeToJSON(message)
      if (json.length === 0 || json[0].type !== 'reply') return false
      message = convertJSONToCQCode(json.slice(1))
    }
    if (config.command_prefix !== '') {
      if (message.startsWith(config.command_prefix)) {
        message = message.slice(config.command_prefix.length)
      } else {
        return false
      }
    }

    const messageArr = message.split(' ')
    return {
      name: messageArr[0],
      args: messageArr.slice(1),
    }
  }

  async checkCommand(context: AllHandlers['message'], event: commandEvent, command: Command) {
    const { commandName, params, pluginName } = event

    // 检查命令名
    if (
      commandName !== '*' &&
      ((typeof commandName === 'string' && commandName !== command.name) ||
        (commandName instanceof RegExp && command.name.match(commandName) === null))
    ) {
      this.logger.DEBUG(`命令不满足插件 ${pluginName} 需求的 ${commandName} 触发条件`)
      return false
    }

    if (!params || params.length === 0) return true

    for (const [index, param] of params.entries()) {
      let arg = command.args[index]

      // 如果没给这个参数
      if (!arg) {
        if (!param.default) {
          this.logger.DEBUG(`参数长度不符合插件 ${pluginName} 需求的 ${commandName} 触发条件`)
          await sendMsg(context, [Structs.text([`参数长度不足~`, `请使用: ${BotConfig.command_prefix}help ${commandName} 查看使用方法`].join('\n'))])
          return false
        }

        arg = param.default
        command.args[index] = param.default
      }

      if (param.type === 'number' && isNaN(Number(arg))) {
        this.logger.DEBUG(`参数类型不符合插件 ${pluginName} 需求的 ${commandName} 触发条件`)
        await sendMsg(context, [
          Structs.text(
            [`参数不合法~`, `参数第 [${index + 1}] 位需要是数字哦`, `请使用: ${BotConfig.command_prefix}help ${commandName} 查看使用方法`].join('\n'),
          ),
        ])
        return false
      } else if (param.type === 'enum' && !param.enum.includes(arg)) {
        this.logger.DEBUG(`参数值不在插件 ${pluginName} 需求的 ${commandName} 可用范围内`)
        await sendMsg(context, [
          Structs.text(
            [
              `参数不合法~`,
              `参数第 [${index + 1}] 位可用值: [${param.enum}]`,
              `请使用: ${BotConfig.command_prefix}help ${commandName} 查看使用方法`,
            ].join('\n'),
          ),
        ])
        return false
      }
    }

    return true
  }

  initEvents() {
    // 防止重连重新注册所有事件
    if (global.events) return

    global.events = {
      command: [],
      message: [],
      notice: [],
      request: [],
    }

    bot.on('message', async (context) => {
      this.logger.DEBUG('收到消息:')
      this.logger.DIR(context)

      const messageEvents = events.message

      for (let i = 0; i < messageEvents.length; i++) {
        const { callback, pluginName, needReply = false } = messageEvents[i]

        this.logger.DEBUG(`插件 ${pluginName} 处理中`)
        if (needReply && context.message[0].type !== 'reply') {
          this.logger.DEBUG(`消息不满足插件 ${pluginName} 需求的回复消息触发条件`)
          continue
        }

        try {
          const response = await callback(context)
          if (response === 'quit') {
            this.logger.DEBUG(clc.red(`插件${pluginName} 申请终止继续触发其他插件`))
            return
          }
        } catch (error) {
          this.logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.logger.ERROR(`stack信息:\n${new Error().stack}`)
          this.logger.DIR(error, false)
        }
      }

      const commandEvent = events.command

      for (let i = 0; i < commandEvent.length; i++) {
        const { callback, pluginName, needReply = false } = commandEvent[i]

        this.logger.DEBUG(`插件 ${pluginName} 处理中`)
        if (needReply && context.message[0].type !== 'reply') {
          this.logger.DEBUG(`消息不满足插件 ${pluginName} 需求的回复消息触发条件`)
          continue
        }

        try {
          const command = Bot.parseMessage(context.raw_message, needReply)
          if (!command) continue

          const canContinue = await this.checkCommand(context, commandEvent[i], command)
          if (!canContinue) continue

          this.logger.DEBUG(clc.green(`消息符合插件 ${pluginName} 需求的 ${commandEvent[i].commandName} 的触发条件`))

          const response = await callback(context, command)
          if (response === 'quit') {
            this.logger.DEBUG(clc.red(`插件${pluginName} 申请终止继续触发其他插件`))
            break
          }
        } catch (error) {
          this.logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.logger.ERROR(`stack信息:\n${new Error().stack}`)
          this.logger.DIR(error, false)
        }
      }
    })

    bot.on('notice', async (context) => {
      this.logger.DEBUG('收到通知:')
      this.logger.DIR(context)

      const noticeEvents = events.notice

      for (let i = 0; i < noticeEvents.length; i++) {
        const { callback, pluginName } = noticeEvents[i]

        try {
          this.logger.DEBUG(`插件 ${pluginName} 处理中`)
          const response = await callback(context)
          if (response === 'quit') {
            this.logger.DEBUG(clc.red(`插件${pluginName} 申请终止继续触发其他插件`))
            break
          }
        } catch (error) {
          this.logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.logger.ERROR(`stack信息:\n${new Error().stack}`)
          this.logger.DIR(error, false)
        }
      }
    })

    bot.on('request', async (context) => {
      this.logger.DEBUG('收到请求:')
      this.logger.DIR(context)

      const requestEvents = events.request

      for (let i = 0; i < requestEvents.length; i++) {
        const { callback, pluginName } = requestEvents[i]

        try {
          this.logger.DEBUG(`插件 ${pluginName} 处理中`)
          const response = await callback(context)
          if (response === 'quit') {
            this.logger.DEBUG(clc.red(`插件${pluginName} 申请终止继续触发其他插件`))
            break
          }
        } catch (error) {
          this.logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.logger.ERROR(`stack信息:\n${new Error().stack}`)
          this.logger.DIR(error, false)
        }
      }
    })
  }
}
