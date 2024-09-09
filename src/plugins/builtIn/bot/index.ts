import type { Command, commandEvent } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/base.ts'
import { config as BotConfig } from '@/plugins/builtIn/bot/config.ts'
import clc from 'cli-color'
import type { AllHandlers } from 'node-napcat-ts'
import { NCWebsocket, Structs } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Bot extends BasePlugin {
  async init() {
    return new Promise((resolve, reject) => {
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
        this.logger.DEBUG('收到API失败响应')
        this.logger.DIR(context)
      })

      bot.on('socket.connecting', (context) => {
        this.logger.INFO(
          `连接中#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`
        )
      })

      bot.on('socket.error', (context) => {
        this.logger.ERROR(
          `连接失败#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`
        )
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
        this.logger.SUCCESS(
          `连接成功#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`
        )
        await this.connectSuccess(bot)
        resolve(true)
      })

      bot.connect()
    })
  }

  async connectSuccess(bot: NCWebsocket) {
    global.bot = bot

    this.initEvents()

    if (debug || !config.online) return
    if (config.online.to <= 0) return this.logger.INFO('未设置发送账户,请注意~')

    try {
      await sendMsg({ message_type: 'private', user_id: config.online.to }, [
        Structs.text(config.online.msg)
      ])
    } catch (error) {
      this.logger.ERROR('发送上线信息失败!')
      this.logger.ERROR(error)
    }
  }

  static parseMessage(message: string): Command | false {
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
      args: messageArr.slice(1)
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
          await sendMsg(context, [
            Structs.text(
              [
                `参数长度不足~`,
                `请使用: ${BotConfig.command_prefix}help ${commandName} 查看使用方法`
              ].join('\n')
            )
          ])
          return false
        }

        arg = param.default
        command.args[index] = param.default
      }

      if (param.type === 'number' && isNaN(Number(arg))) {
        this.logger.DEBUG(`参数类型不符合插件 ${pluginName} 需求的 ${commandName} 触发条件`)
        await sendMsg(context, [
          Structs.text(
            [
              `参数不合法~`,
              `参数第 [${index + 1}] 位需要是数字哦`,
              `请使用: ${BotConfig.command_prefix}help ${commandName} 查看使用方法`
            ].join('\n')
          )
        ])
        return false
      } else if (param.type === 'enum' && !param.enum.includes(arg)) {
        this.logger.DEBUG(`参数值不在插件 ${pluginName} 需求的 ${commandName} 可用范围内`)
        await sendMsg(context, [
          Structs.text(
            [
              `参数不合法~`,
              `参数第 [${index + 1}] 位可用值: [${param.enum}]`,
              `请使用: ${BotConfig.command_prefix}help ${commandName} 查看使用方法`
            ].join('\n')
          )
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
      request: []
    }

    bot.on('message', async (context) => {
      this.logger.DEBUG('收到消息:')
      this.logger.DIR(context)

      const messageEvents = events.message

      for (let i = 0; i < messageEvents.length; i++) {
        const { callback, pluginName } = messageEvents[i]

        try {
          this.logger.DEBUG(`插件 ${pluginName} 处理中`)
          const response = await callback(context)
          if (response === 'quit') {
            this.logger.DEBUG(clc.red(`插件${pluginName} 申请终止继续触发其他插件`))
            return
          }
        } catch (error) {
          this.logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.logger.ERROR(error)
          this.logger.DEBUG(`stack信息:\n${new Error().stack}`)
        }
      }

      const commandEvent = events.command

      for (let i = 0; i < commandEvent.length; i++) {
        const { callback, pluginName } = commandEvent[i]

        try {
          this.logger.DEBUG(`插件 ${pluginName} 处理中`)

          const command = Bot.parseMessage(context.raw_message)
          if (!command) continue

          const canContinue = await this.checkCommand(context, commandEvent[i], command)
          if (!canContinue) continue

          this.logger.DEBUG(
            clc.green(`消息符合插件 ${pluginName} 需求的 ${commandEvent[i].commandName} 的触发条件`)
          )

          const response = await callback(context, command)
          if (response === 'quit') {
            this.logger.DEBUG(clc.red(`插件${pluginName} 申请终止继续触发其他插件`))
            break
          }
        } catch (error) {
          this.logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.logger.ERROR(error)

          const stack = new Error().stack!.split('\n')
          this.logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
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
          this.logger.ERROR(error)
          this.logger.ERROR(`stack信息:\n`, new Error().stack)
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
          this.logger.ERROR(error)
          this.logger.ERROR(`stack信息:\n`, new Error().stack)
        }
      }
    })
  }
}
