import type { allEvents, Command } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { config as BotConfig } from '@/plugins/BuiltIn/Bot/config.ts'
import { Structs, type AllHandlers, type WSSendParam } from 'node-napcat-ts'

export default class CallApi extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: 'call',
      description: 'call [API端点] [参数]',
      params: [{ type: 'string' }, { type: 'string', default: '{}' }],
      callback: this.send.bind(this),
    },
    {
      type: 'command',
      commandName: 'get_id',
      description: 'get_id [回复消息]',
      callback: this.get_id.bind(this),
      needReply: true,
    },
  ]

  async send(context: AllHandlers['message'], command: Command) {
    if (BotConfig.admin_id !== context.user_id) {
      await sendMsg(context, [Structs.text('只有管理员可以执行此操作')])
      return
    }

    const [api, ...paramsText] = command.args

    let params: any
    try {
      params = JSON.parse(paramsText.join(''))
    } catch (_error) {
      await sendMsg(context, [Structs.text('参数不是正确的JSON')])
      return
    }

    if (api in bot) {
      try {
        const res = await bot[api as keyof WSSendParam](params)
        const response = await sendMsg(context, [Structs.text('API 调用成功,返回信息:\n' + JSON.stringify(res, null, '\t'))])
        if (!response) {
          await sendMsg(context, [Structs.text('API 调用成功,不过返回信息过长')])
        }
      } catch (error) {
        this.logger.ERROR('API 调用出错')
        this.logger.DIR(error, false)
        await sendMsg(context, [Structs.text('API 调用出错,错误日志:\n' + JSON.stringify(error, null, '\t'))])
      }
    } else {
      await sendMsg(context, [Structs.text('API 端点不存在')])
    }
  }

  async get_id(context: AllHandlers['message']) {
    const firstMessage = context.message[0]
    if (!firstMessage || firstMessage.type !== 'reply') return
    await sendMsg(context, [Structs.text(`消息ID: ${firstMessage.data.id}`)])
  }
}
