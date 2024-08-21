import { Logger, makeLogger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { MessageHandler, NCWebsocket, Structs } from 'node-napcat-ts'
import { config } from './config.ts'
import { Command, commandEvent } from '@/global.js'
import clc from 'cli-color'

export default class Bot {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'bot' })
  }

  async init() {
    return new Promise((resolve, reject) => {
      const bot = new NCWebsocket(config.connect)

      bot.on('socket.connecting', (context) => {
        this.#logger.INFO(
          `连接中#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`
        )
      })

      bot.on('socket.error', (context) => {
        this.#logger.ERROR(
          `连接失败#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`
        )
        this.#logger.ERROR(context)

        if (context.reconnection.nowAttempts >= context.reconnection.attempts) {
          reject(`重试次数超过设置的${context.reconnection.attempts}次!`)
        }
      })

      bot.on('socket.open', async (context) => {
        this.#logger.SUCCESS(
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
    if (config.online.to <= 0) return this.#logger.INFO('未设置发送账户,请注意~')

    try {
      await sendMsg({ message_type: 'private', user_id: config.online.to }, [
        Structs.text({ text: config.online.msg })
      ])
    } catch (error) {
      this.#logger.ERROR('发送上线信息失败!')
      this.#logger.ERROR(error)
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

  async checkCommand(context: MessageHandler['message'], event: commandEvent, command: Command) {
    const { commandName, params, pluginName } = event

    // 检查命令名
    if (commandName !== '*' && commandName !== command.name) {
      this.#logger.DEBUG(`命令不满足插件 ${pluginName} 需求的 ${commandName} 触发条件`)
      return false
    }

    if (!params || params.length === 0) return true

    for (const [index, param] of params.entries()) {
      let arg = command.args[index]

      // 如果没给这个参数
      if (!arg) {
        if (!param.default) {
          this.#logger.DEBUG(`参数长度不符合插件 ${pluginName} 需求的 ${commandName} 触发条件`)
          await sendMsg(context, [Structs.text({ text: '参数长度不足~' })])
          return false
        }

        arg = param.default
        command.args[index] = param.default
      }

      if (param.type === 'number' && isNaN(Number(arg))) {
        this.#logger.DEBUG(`参数类型不符合插件 ${pluginName} 需求的 ${name} 触发条件`)
        await sendMsg(context, [Structs.text({ text: `参数不合法~\n参数需要是数字` })])
        return false
      } else if (param.type === 'enum' && !param.enum.includes(arg)) {
        this.#logger.DEBUG(`参数值不在插件 ${pluginName} 需求的 ${name} 可用范围内`)
        await sendMsg(context, [Structs.text({ text: `参数不合法~\n参数可用值:[${param.enum}]` })])
        return false
      }
    }

    return true
  }

  initEvents() {
    global.events = {
      command: [],
      message: [],
      notice: [],
      request: []
    }

    bot.on('message', async (context) => {
      this.#logger.DEBUG('收到消息:')
      this.#logger.DIR(context)

      const commandEvent = events.command

      for (let i = 0; i < commandEvent.length; i++) {
        const { callback, pluginName } = commandEvent[i]

        try {
          const command = Bot.parseMessage(context.raw_message)
          if (!command) continue

          const canContinue = await this.checkCommand(context, commandEvent[i], command)
          if (!canContinue) continue

          this.#logger.DEBUG(clc.green(`消息符合插件 ${pluginName} 的触发条件`))

          const response = await callback(context, command)
          if (response === 'quit') break
        } catch (error) {
          this.#logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.#logger.ERROR(error)

          const stack = new Error().stack!.split('\n')
          this.#logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
        }
      }

      const messageEvents = events.message

      for (let i = 0; i < messageEvents.length; i++) {
        const { callback, pluginName } = messageEvents[i]

        try {
          const response = await callback(context)
          if (response === 'quit') break
        } catch (error) {
          this.#logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.#logger.ERROR(error)
          this.#logger.ERROR(`stack信息:\n`, new Error().stack)
        }
      }
    })

    bot.on('notice', async (context) => {
      this.#logger.DEBUG('收到通知:')
      this.#logger.DIR(context)

      const noticeEvents = events.notice

      for (let i = 0; i < noticeEvents.length; i++) {
        const { callback, pluginName } = noticeEvents[i]

        try {
          const response = await callback(context)
          if (response === 'quit') break
        } catch (error) {
          this.#logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.#logger.ERROR(error)
          this.#logger.ERROR(`stack信息:\n`, new Error().stack)
        }
      }
    })

    bot.on('request', async (context) => {
      this.#logger.DEBUG('收到请求:')
      this.#logger.DIR(context)

      const requestEvents = events.request

      for (let i = 0; i < requestEvents.length; i++) {
        const { callback, pluginName } = requestEvents[i]

        try {
          const response = await callback(context)
          if (response === 'quit') break
        } catch (error) {
          this.#logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.#logger.ERROR(error)
          this.#logger.ERROR(`stack信息:\n`, new Error().stack)
        }
      }
    })
  }
}
