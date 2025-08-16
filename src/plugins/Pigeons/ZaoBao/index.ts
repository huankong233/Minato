import type { allEvents, Command } from '@/global.js'
import axios from '@/libs/axios.ts'
import { cron } from '@/libs/cron.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Structs, type SendMessageSegment } from 'node-napcat-ts'
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
          default: config.type,
        },
      ],
      callback: (context, command) => this.zaobao(context, command),
    },
    {
      type: 'command',
      commandName: '每日60秒',
      description: '每日60秒',
      callback: (context, command) => this.zaobao(context, { name: command.name, args: ['每天60秒'] }),
    },
    {
      type: 'command',
      commandName: '摸鱼人日历',
      description: '摸鱼人日历',
      callback: (context, command) => this.zaobao(context, { name: command.name, args: ['摸鱼人日历'] }),
    },
  ]

  urls = {
    每天60秒: {
      api: 'https://api.03c3.cn/api/zb?type=jsonImg',
      checkSuccess: (data: any) => data.msg === 'ok',
      getImage: (data: any) => data.data.imageurl,
    },
    摸鱼人日历: {
      api: 'https://api.huankong.top/moyu',
      checkSuccess: (data: any) => data.code === 200,
      getImage: (data: any) => data.data.image,
    },
  }

  async getData(type: ZaoBaoConfig['type']): Promise<SendMessageSegment[]> {
    const url = this.urls[type]
    let response
    try {
      response = await axios.get(url.api)
    } catch (error) {
      this.logger.ERROR('获取早报失败了喵')
      this.logger.DIR(error, false)
      return [Structs.text('获取早报失败了喵~')]
    }
    if (!url.checkSuccess(response.data)) return [Structs.text('获取早报失败了喵~')]
    const image = url.getImage(response.data)
    try {
      const base64 = await axios.get(image, { responseType: 'arraybuffer' })
      return [Structs.image(`base64://${Buffer.from(base64.data).toString('base64')}`)]
    } catch (error) {
      this.logger.ERROR('下载图片失败了喵')
      this.logger.DIR(error, false)
      return [Structs.text('下载图片失败了喵~')]
    }
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

  async zaobao(context: { message_type: 'private'; user_id: number } | { message_type: 'group'; group_id: number }, command: Command) {
    const type = command.args[0] as ZaoBaoConfig['type']
    const response = await this.getData(type)
    await sendMsg(context, response)
  }
}
