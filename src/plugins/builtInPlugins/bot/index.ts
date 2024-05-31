import { Logger, makeLogger } from '@/libs/logger.ts'
import { NCWebsocket } from 'node-napcat-ts'
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
          await this.connectSuccess()
          resolve(true)
        } else {
          wsType = '/api'
        }
      })

      bot.on('socket.eventOpen', async () => {
        this.#logger.SUCCESS(`连接成功[/event]#${attempts}`)
        if (wsType === '/api') {
          await this.connectSuccess()
          resolve(true)
        } else {
          wsType = '/event'
        }
      })

      bot.connect()
    })
  }

  async connectSuccess() {
    this.initEvents()
  }

  initEvents() {}
}
