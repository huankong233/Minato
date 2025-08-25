import { Logger } from '@/logger.ts'
import type { CommandEvent, MessageEvent, NoticeEvent, Param, RegEventOptions, RequestEvent } from '@/reg_event.ts'
import { sort_object_array } from '@/utils.ts'
import type { MessageHandler, NCWebsocketOptions } from 'node-napcat-ts'
import { NCWebsocket } from 'node-napcat-ts'
import process from 'node:process'

export class Bot {
  logger: Logger

  config: NCWebsocketOptions
  debug: boolean

  ws: NCWebsocket

  events: {
    command: CommandEvent[]
    message: MessageEvent[]
    notice: NoticeEvent[]
    request: RequestEvent[]
  } = {
    command: [],
    message: [],
    notice: [],
    request: [],
  }

  constructor(config: NCWebsocketOptions, debug = false, ws: NCWebsocket) {
    this.logger = new Logger('Bot', debug)

    this.config = config
    this.debug = debug
    this.ws = ws

    if (debug) {
      ws.on('api.preSend', (context) => this.logger.DEBUG('发送API请求', context))
      ws.on('api.response.success', (context) => this.logger.DEBUG('收到API成功响应', context))
      ws.on('api.response.failure', (context) => this.logger.DEBUG('收到API失败响应', context))
      ws.on('message', (context) => this.logger.DEBUG('收到消息:', context))
      ws.on('request', (context) => this.logger.DEBUG('收到请求:', context))
      ws.on('notice', (context) => this.logger.DEBUG('收到通知:', context))
    }

    ws.on('message', (context) => {
      const end_point = `message.${context.message_type}.${context.sub_type}`

      for (const event of this.events.message) {
        if (end_point.includes(event.end_point ?? 'message')) event.callback(context)
      }
    })

    ws.on('request', (context) => {
      const end_point = `request.${context.request_type}.${'sub_type' in context ? context.sub_type : ''}`

      for (const event of this.events.request) {
        if (end_point.includes(event.end_point ?? 'request')) event.callback(context)
      }
    })

    ws.on('notice', (context) => {
      let end_point = `notice.${context.notice_type}.${'sub_type' in context ? context.sub_type : ''}`
      if (context.notice_type === 'notify') {
        if (context.sub_type === 'input_status') end_point += `.${context.group_id !== 0 ? 'group' : 'friend'}`
        else if (context.sub_type === 'poke') end_point += `.${'group_id' in context ? 'group' : 'friend'}`
      }

      for (const event of this.events.notice) {
        if (end_point.includes(event.end_point ?? 'notice')) event.callback(context)
      }
    })

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

  reg_event(_options: RegEventOptions) {
    const options = { ..._options, priority: _options.priority ?? 1 }

    switch (options.type) {
      case 'command':
        this.events.command = sort_object_array([...this.events.command, options], 'priority', 'down')
        break
      case 'message':
        this.events.message = sort_object_array([...this.events.message, options], 'priority', 'down')
        break
      case 'notice':
        this.events.notice = sort_object_array([...this.events.notice, options], 'priority', 'down')
        break
      case 'request':
        this.events.request = sort_object_array([...this.events.request, options], 'priority', 'down')
        break
    }
  }

  reg_command<T extends keyof MessageHandler, const K extends Param[]>(options: CommandEvent<T, K>) {
    this.reg_event(options as unknown as RegEventOptions)
  }
}
