import { Logger } from '@/logger.ts'
import type { NCWebsocketOptions } from 'node-napcat-ts'
import { NCWebsocket } from 'node-napcat-ts'
import process from 'node:process'

export class Bot {
  logger: Logger

  config: NCWebsocketOptions
  debug: boolean

  ws: NCWebsocket

  constructor(config: NCWebsocketOptions, debug = false, ws: NCWebsocket) {
    this.logger = new Logger('Bot', debug)

    this.config = config
    this.debug = debug
    this.ws = ws

    this.logger.SUCCESS(`Bot 初始化完成`)
  }

  static async init(config: NCWebsocketOptions, debug = false) {
    return new Promise<Bot>((resolve, reject) => {
      const logger = new Logger('Bot', debug)
      logger.DEBUG(`初始化 Bot 实例`)
      logger.DEBUG(`配置信息:`, config)

      const ws = new NCWebsocket(config)

      ws.on('socket.connecting', (context) => {
        logger.INFO(`连接中#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`)
      })

      ws.on('socket.error', (context) => {
        logger.ERROR(`连接失败#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`)
        logger.ERROR(`错误信息:`, context)

        if (context.error_type === 'response_error') {
          logger.ERROR(`NapCat 服务端返回错误, 可能是 AccessToken 错误`)
          process.exit(1)
        }

        if (context.reconnection.nowAttempts >= context.reconnection.attempts) {
          reject(`重试次数超过设置的${context.reconnection.attempts}次!`)
          throw new Error(`重试次数超过设置的${context.reconnection.attempts}次!`)
        }
      })

      ws.on('socket.open', async (context) => {
        logger.SUCCESS(`连接成功#${context.reconnection.nowAttempts}/${context.reconnection.attempts}`)
        resolve(new Bot(config, debug, ws))
      })

      ws.connect()
    })
  }
}
