import type { botData, botConfig } from './config.d.ts'
import { CQ, CQWebSocket } from '@huan_kong/go-cqwebsocket'
import { globalReg } from '@/libs/globalReg.ts'
import { makeLogger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { format } from '@/libs/eventReg.ts'
import * as emoji from 'node-emoji'

const logger = makeLogger({ pluginName: 'bot', subModule: 'connect' })
const eventLogger = logger.changeSubModule('events')

/**
 * 启动机器人,注册事件等
 */
export default async function () {
  return new Promise((resolve, reject) => {
    const { botConfig } = global.config as { botConfig: botConfig }
    const { botData } = global.data as { botData: botData }

    const bot = new CQWebSocket(botConfig.connect)
    let attempts = 1

    //注册全局变量
    globalReg({ bot })

    bot.on('socket.connecting', function () {
      logger.INFO(`连接中[/api]#${attempts}`)
    })

    bot.on('socket.connectingEvent', function () {
      logger.INFO(`连接中[/event]#${attempts}`)
    })

    bot.on('socket.error', function ({ context }) {
      logger.WARNING(`连接失败[/api]#${attempts}`)
      logger.ERROR(context)
      if (context.code === 1006 && context.reason === '') reject('可能是go-cqhttp地址错误')
      if (attempts++ === botConfig.connect.reconnectionAttempts + 1) {
        reject(`重试次数超过设置的${botConfig.connect.reconnectionAttempts}次!`)
      } else {
        setTimeout(() => bot.reconnect(), botConfig.connect.reconnectionDelay)
      }
    })

    bot.on('socket.errorEvent', function ({ context }) {
      logger.WARNING(`连接失败[/event]#${attempts}`)
      logger.ERROR(context)
    })

    bot.on('socket.open', function () {
      logger.SUCCESS(`连接成功[/api]#${attempts}`)
      if (botData.wsType === '/event') {
        resolve(true)
      } else {
        botData.wsType = '/api'
      }
    })

    bot.on('socket.openEvent', function () {
      logger.SUCCESS(`连接成功[/event]#${attempts}`)
      if (botData.wsType === '/api') {
        resolve(true)
      } else {
        botData.wsType = '/event'
      }
    })

    initEvents()

    bot.connect()
  })
}

function initEvents() {
  const { bot, debug } = global

  //初始化事件
  global.events = {
    message: [],
    notice: [],
    request: []
  }

  //事件处理
  bot.on('message', async event => {
    const { message: events } = global.events
    const { context } = event

    if (debug) eventLogger.DEBUG(`收到信息:\n`, context)

    context.message = emoji.unemojify(CQ.unescape(context.message.toString().trim()))

    for (let i = 0; i < events.length; i++) {
      try {
        const response = await events[i].callback(event, format(context.message))
        if (response === 'quit') break
      } catch (error) {
        eventLogger.WARNING(`插件${events[i].pluginName}运行错误`)
        eventLogger.ERROR(error)
      }
    }
  })

  bot.on('notice', async event => {
    const { notice: events } = global.events
    const { context } = event

    if (debug) eventLogger.DEBUG(`收到通知:\n`, context)

    for (let i = 0; i < events.length; i++) {
      try {
        const response = await events[i].callback(event)
        if (response === 'quit') break
      } catch (error) {
        eventLogger.WARNING(`插件${events[i].pluginName}运行错误`)
        eventLogger.ERROR(error)
      }
    }
  })

  bot.on('request', async event => {
    const { request: events } = global.events
    const { context } = event

    if (debug) eventLogger.DEBUG(`收到请求:\n`, context)

    for (let i = 0; i < events.length; i++) {
      try {
        const response = await events[i].callback(event)
        if (response === 'quit') break
      } catch (error) {
        eventLogger.WARNING(`插件${events[i].pluginName}运行错误`)
        eventLogger.ERROR(error)
      }
    }
  })
}

/**
 * 机器人启动成功
 */
export async function bootstrapComplete() {
  const { botConfig } = global.config as { botConfig: botConfig }
  const { botData } = global.config as { botData: botData }
  if (dev || !botConfig.online.enable) return
  if (botConfig.admin <= 0) return logger.NOTICE('未设置管理员账户,请检查!')
  await sendMsg(botConfig.admin, `${botConfig.online.msg}`)

  botData.ffmpeg = (await bot.can_send_record()).yes
  botData.info = await bot.get_login_info()
}
