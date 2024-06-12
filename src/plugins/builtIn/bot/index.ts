import { Command, commandEvent } from '@/global.ts'
import { Logger, makeLogger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { MessageHandler, NCWebsocket } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Bot {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'bot' })
  }

  async init() {
    return new Promise((resolve, reject) => {
      const bot = new NCWebsocket(config.connect)
      let attempts = 1
      let wsType = ''

      bot.on('socket.apiConnecting', () => {
        this.#logger.INFO(`连接中[/api]#${attempts}`)
      })

      bot.on('socket.eventConnecting', () => {
        this.#logger.INFO(`连接中[/event]#${attempts}`)
      })

      bot.on('socket.apiError', (context) => {
        this.#logger.ERROR(`连接失败[/api]#${attempts}`)
        this.#logger.ERROR(context)
      })

      bot.on('socket.eventError', (context) => {
        this.#logger.ERROR(`连接失败[/event]#${attempts}`)
        this.#logger.ERROR(context)

        if (!config.reconnection.enable) reject(`连接失败!`)

        if (attempts >= config.reconnection.attempts) {
          reject(`重试次数超过设置的${config.reconnection.attempts}次!`)
        } else {
          setTimeout(() => bot.reconnect(), config.reconnection.delay)
        }

        attempts++
      })

      bot.on('socket.apiOpen', async () => {
        this.#logger.SUCCESS(`连接成功[/api]#${attempts}`)
        if (wsType === '/event') {
          await this.connectSuccess(bot)
          resolve(true)
        } else {
          wsType = '/api'
        }
      })

      bot.on('socket.eventOpen', async () => {
        this.#logger.SUCCESS(`连接成功[/event]#${attempts}`)
        if (wsType === '/api') {
          await this.connectSuccess(bot)
          resolve(true)
        } else {
          wsType = '/event'
        }
      })

      bot.connect()
    })
  }

  async connectSuccess(bot: NCWebsocket) {
    global.bot = bot

    this.initEvents()

    if (isDev || !config.online) return
    if (config.online.to <= 0) return this.#logger.INFO('未设置发送账户,请注意~')

    try {
      await sendMsg({ message_type: 'private', user_id: config.online.to }, config.online.msg)
    } catch (error) {
      this.#logger.ERROR('发送上线信息失败!')
      this.#logger.DEBUG(error)
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

  initEvents() {
    global.events = {
      command: [],
      message: [],
      notice: [],
      request: []
    }

    bot.on('message', async (context) => {
      context.message = context.message.trim()

      this.#logger.DEBUG('收到消息:\n', context)

      const commandEvent = events.command

      for (let i = 0; i < commandEvent.length; i++) {
        const { callback, pluginName } = commandEvent[i]

        try {
          const command = Bot.parseMessage(context.message)

          const canContinue = await this.checkCommand(context, commandEvent[i], command)
          if (!canContinue) continue

          this.#logger.SUCCESS(`消息符合插件 ${pluginName} 的触发条件`)

          const response = await callback(context, command as Command)
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

          const stack = new Error().stack!.split('\n')
          this.#logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
        }
      }
    })

    bot.on('notice', async (context) => {
      this.#logger.DEBUG('收到通知: \n', context)

      const noticeEvents = events.notice

      for (let i = 0; i < noticeEvents.length; i++) {
        const { callback, pluginName } = noticeEvents[i]

        try {
          const response = await callback(context)
          if (response === 'quit') break
        } catch (error) {
          this.#logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.#logger.ERROR(error)

          const stack = new Error().stack!.split('\n')
          this.#logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
        }
      }
    })

    bot.on('request', async (context) => {
      this.#logger.DEBUG('收到请求: \n', context)

      const requestEvents = events.request

      for (let i = 0; i < requestEvents.length; i++) {
        const { callback, pluginName } = requestEvents[i]

        try {
          const response = await callback(context)
          if (response === 'quit') break
        } catch (error) {
          this.#logger.ERROR(`插件 ${pluginName} 运行出错`)
          this.#logger.ERROR(error)

          const stack = new Error().stack!.split('\n')
          this.#logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
        }
      }
    })
  }

  async checkCommand(
    context: MessageHandler['message'],
    event: commandEvent,
    command: Command | false
  ) {
    const { name, params, pluginName } = event

    // 检查命令名
    if (
      !command ||
      (name instanceof Array && !name.includes(command.name)) ||
      (typeof name === 'string' && name !== command.name)
    ) {
      this.#logger.DEBUG(`消息不符合插件 ${pluginName} 的触发条件`)
      return false
    }

    // 检查参数
    if (params && params.length > 0) {
      for (let j = 0; j < params.length; j++) {
        const param = params[j]

        if (param instanceof Array) {
          for (let k = 0; k < param.length; k++) {
            const innerParam = param[k]
            let arg = command.args[k]

            if (!arg) {
              if (!innerParam.default) {
                this.#logger.DEBUG(`参数长度不符合插件 ${pluginName} 的触发条件`)
                await sendMsg(context, '参数长度不足~')
                return false
              }

              arg = innerParam.default
              command.args[j] = arg
            }

            if (innerParam.type === 'number' && isNaN(Number(arg))) {
              this.#logger.DEBUG(`参数类型不符合插件 ${pluginName} 的触发条件`)
              await sendMsg(context, `参数不合法~\n参数需要是数字`)
              return false
            }

            if (innerParam.type === 'enum' && !innerParam.enum.includes(arg)) {
              this.#logger.DEBUG(`参数值不在插件 ${pluginName} 的可用范围内`)
              await sendMsg(context, `参数不合法~\n参数可用值:[${innerParam.enum}]`)
              return false
            }
          }
        } else {
          let arg = command.args[j]

          if (!arg) {
            if (!param.default) {
              this.#logger.DEBUG(`参数长度不符合插件 ${pluginName} 的触发条件`)
              await sendMsg(context, '参数长度不足~')
              return false
            }

            arg = param.default
            command.args[j] = arg
          }

          if (param.type === 'number' && isNaN(Number(arg))) {
            this.#logger.DEBUG(`参数类型不符合插件 ${pluginName} 的触发条件`)
            await sendMsg(context, `参数不合法~\n参数需要是数字`)
            return false
          }

          if (param.type === 'enum' && !param.enum.includes(arg)) {
            this.#logger.DEBUG(`参数值不在插件 ${pluginName} 的可用范围内`)
            await sendMsg(context, `参数不合法~\n参数可用值:[${param.enum}]`)
            return false
          }
        }
      }
    }

    return true
  }
}
