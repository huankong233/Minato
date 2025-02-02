import type { allEvents, Command, SeTu as SeTuModel } from '@/global.js'
import axios from '@/libs/axios.ts'
import { confuseURL } from '@/libs/handleUrl.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { isBeforeToday } from '@/libs/time.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { config as ProxyConfig } from '@/plugins/BuiltIn/Proxy/config.ts'
import PigeonTool from '@/plugins/Pigeons/PigeonTool/index.ts'
import { AxiosError } from 'axios'
import { Structs, type AllHandlers } from 'node-napcat-ts'
import { imgAntiShielding } from './AntiShielding.ts'
import { config } from './config.ts'

export default class SeTu extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: config.reg,
      description: `${config.reg}`,
      callback: this.send.bind(this),
    },
  ]

  async send(context: AllHandlers['message'], command: Command) {
    const { user_id } = context

    const userData = await knex<SeTuModel>('se_tu').where('user_id', user_id).first()

    if (!userData) {
      // 第一次看色图
      await knex<SeTuModel>('se_tu').insert({ user_id })
      await this.send(context, command)
      return
    }

    let { today_count, total_count } = userData

    if (isBeforeToday(userData.updated_at.getTime())) {
      // 如果不是今天就清零
      today_count = 0
    }

    // 每天上限
    if (today_count >= config.limit) {
      await sendMsg(context, [Structs.image('https://api.lolicon.app/assets/img/lx.jpg')])
      return
    }

    const isEnough = PigeonTool.reduce(context, config.pigeon, '看色图')
    if (!isEnough) {
      await sendMsg(context, [Structs.text('你的鸽子不够哦~')])
      return
    }

    const match = command.name.match(config.reg)
    if (!match) return

    const requestData: {
      r18: 1 | 0
      tag: string[][]
      proxy: false | string
    } = {
      r18: match[1] ? 1 : 0,
      tag: [],
      proxy: ProxyConfig.enable ? false : config.proxy.enable ? config.proxy.url : false,
    }

    if (match[2]) requestData.tag = match[2].split('|').map((element) => element.split('&'))

    let responseData

    try {
      responseData = await axios.post('https://api.lolicon.app/setu/v2', requestData).then((res) => res.data)
    } catch (error) {
      this.logger.ERROR('请求色图接口失败~')
      this.logger.DIR(error, false)
      await PigeonTool.add(context, config.pigeon, '请求色图接口失败~')
      await sendMsg(context, [Structs.text('请求色图接口失败~')])
      return
    }

    if (responseData === ':D') {
      await PigeonTool.add(context, config.pigeon, '机器人IP被Ban啦,换个试试吧~')
      await sendMsg(context, [Structs.text('机器人IP被Ban啦,换个试试吧~')])
      return
    }

    if (responseData.data.length > 0) {
      responseData = responseData.data[0]
    } else {
      await PigeonTool.add(context, config.pigeon, '换个标签试试吧~')
      await sendMsg(context, [Structs.text('换个标签试试吧~')])
      return
    }

    const fullUrl = `https://www.pixiv.net/artworks/${responseData.pid}`
    let shortUrlData

    if (config.short.enable) {
      try {
        shortUrlData = await axios
          .get(`${config.short.url}/api/url`, {
            params: { url: fullUrl },
          })
          .then((res) => res.data)
      } catch (error) {
        this.logger.ERROR('短链服务器爆炸惹~')
        this.logger.DIR(error, false)
        await PigeonTool.add(context, config.pigeon, '换个标签试试吧~')
        await sendMsg(context, [Structs.text('短链服务器爆炸惹~')])
        return
      }
    }

    const infoMessage = await sendMsg(context, [
      Structs.text(
        [
          `标题: ${responseData.title}`,
          `标签: ${responseData.tags.join(' ')}`,
          `AI作品: ${responseData.aiType ? '是' : '不是'}`,
          `作品地址: ${config.short.enable ? shortUrlData.url : confuseURL(fullUrl)}`,
        ].join('\n'),
      ),
    ])
    if (!infoMessage) return

    let image

    try {
      image = await axios
        .get(responseData.urls.original, {
          headers: { Referer: 'https://www.pixiv.net/' },
          responseType: 'arraybuffer',
        })
        .then((res) => res.data)
    } catch (error) {
      this.logger.ERROR('请求P站图片失败~')
      this.logger.DIR(error, false)
      if (error instanceof AxiosError && error.response && error.response.status === 404) {
        await PigeonTool.add(context, config.pigeon, '这张色图被删了,真可惜~')
        await sendMsg(context, [Structs.text('这张色图被删了,真可惜~')])
      } else {
        await PigeonTool.add(context, config.pigeon, '请求P站图片失败~')
        await sendMsg(context, [Structs.text('请求P站图片失败~')])
      }
      return
    }

    let base64

    try {
      //反和谐
      base64 = await imgAntiShielding(image, config.antiShieldingMode)
    } catch (error) {
      this.logger.ERROR('反和谐失败')
      this.logger.DIR(error, false)
      await PigeonTool.add(context, config.pigeon, '反和谐失败')
      await sendMsg(context, [Structs.text('反和谐失败')])
      return
    }

    const imageMessage = await sendMsg(context, [Structs.image(`base64://${base64}`)])
    if (!imageMessage) return

    setTimeout(async () => {
      await bot.delete_msg({ message_id: infoMessage.message_id })
      await bot.delete_msg({ message_id: imageMessage.message_id })
    }, config.withdraw * 1000)

    today_count++
    total_count++
    await knex<SeTuModel>('se_tu').where('user_id', user_id).update({ today_count, total_count })
  }
}
