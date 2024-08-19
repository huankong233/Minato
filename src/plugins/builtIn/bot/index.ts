import { Logger, makeLogger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { NCWebsocket, Structs } from 'node-napcat-ts'
import { config } from './config.ts'

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

    if (isDev || !config.online) return
    if (config.online.to <= 0) return this.#logger.INFO('未设置发送账户,请注意~')

    try {
      await sendMsg({ message_type: 'private', user_id: config.online.to }, [
        Structs.text({ text: config.online.msg })
      ])
    } catch (error) {
      this.#logger.ERROR('发送上线信息失败!')
      this.#logger.DEBUG(error)
    }
  }

  initEvents() {
    global.events = {
      message: [],
      notice: [],
      request: []
    }

    bot.on('message', async (context) => {
      this.#logger.DEBUG('收到消息:')
      this.#logger.DIR(context)

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

          const stack = new Error().stack!.split('\n')
          this.#logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
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

          const stack = new Error().stack!.split('\n')
          this.#logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
        }
      }
    })
  }
}
