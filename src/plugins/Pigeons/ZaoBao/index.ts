import type { allEvents, Command } from '@/global.js'
import axios from '@/libs/axios.ts'
import { cron } from '@/libs/cron.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Structs, type Send } from 'node-napcat-ts'
import { config, type ZaoBaoConfig } from './config.ts'

export default class ZaoBao extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '早报',
      description: '早报 [每天60秒/摸鱼人日历]',
      params: [
        {
          type: 'enum',
          enum: ['每天60秒', '摸鱼人日历'],
          default: config.type
        }
      ],
      callback: (context, command) => this.zaobao(context, command)
    },
    {
      type: 'command',
      commandName: '每日60秒',
      description: '每日60秒',
      callback: (context, command) =>
        this.zaobao(context, { name: command.name, args: ['每天60秒'] })
    },
    {
      type: 'command',
      commandName: '摸鱼人日历',
      description: '摸鱼人日历',
      callback: (context, command) =>
        this.zaobao(context, { name: command.name, args: ['摸鱼人日历'] })
    }
  ]

  urls = {
    每天60秒: {
      api: 'https://api.2xb.cn/zaob',
      checkSuccess: (data: any) => data.msg === 'Success',
      getImage: (data: any) => data.imageUrl
    },
    摸鱼人日历: {
      api: 'https://api.vvhan.com/api/moyu?type=json',
      checkSuccess: (data: any) => data.success,
      getImage: (data: any) => data.url
    }
  }

  async getData(type: ZaoBaoConfig['type']): Promise<Send[keyof Send][]> {
    const url = this.urls[type]
    let response
    try {
      response = await axios.get(url.api)
    } catch (_error) {
      return [Structs.text('早报获取失败了喵~')]
    }
    if (!url.checkSuccess(response.data)) return [Structs.text('获取失败了喵~')]
    const image = url.getImage(response.data)
    const base64 = await axios.get(image, { responseType: 'arraybuffer' })
    return [Structs.image(`base64://${Buffer.from(base64.data).toString('base64')}`)]
  }

  init = () => {
    config.boardcast.forEach((item) => {
      cron(item.crontab ?? config.crontab, async () => {
        const response = await this.getData(item.type ?? config.type)
        if ('group_id' in item) {
          await sendMsg({ message_type: 'group', group_id: item.group_id }, response)
        } else {
          await sendMsg({ message_type: 'private', user_id: item.user_id }, response)
        }
      })
    })
  }

  async zaobao(
    context:
      | { message_type: 'private'; user_id: number }
      | { message_type: 'group'; group_id: number },
    command: Command
  ) {
    const type = command.args[0] as ZaoBaoConfig['type']
    const response = await this.getData(type)
    await sendMsg(context, response)
  }
}
