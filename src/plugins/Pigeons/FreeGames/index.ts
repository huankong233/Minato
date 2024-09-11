// import { eventReg } from '@/libs/eventReg.ts'
// import { makeLogger } from '@/libs/logger.ts'
// import { quickOperation, sendForwardMsg } from '@/libs/sendMsg.ts'
// import { sleep } from '@/libs/sleep.ts'
// import { CronJob } from 'cron'
// import { epicApi, steamApi } from './lib.ts'

// const logger = makeLogger({ pluginName: 'freegames' })

// export default async () => {
//   await init()

//   event()
// }

// function event() {
//   eventReg('message', async (context, command) => {
//     if (!command) return
//     if (command.name === 'freegames') await freegames(context)
//   })
// }

// async function init() {
//   const { freegamesConfig } = global.config as { freegamesConfig: freegamesConfig }

//   if (freegamesConfig.groups.length === 0) return
//   new CronJob(
//     freegamesConfig.crontab,
//     async function () {
//       let messages
//       try {
//         messages = await prepareMessage()
//       } catch (error) {
//         logger.WARNING(`请求接口失败`)
//         logger.ERROR(error)
//         return
//       }

//       for (let i = 0; i < freegamesConfig.groups.length; i++) {
//         const group_id = freegamesConfig.groups[i]

//         await sendForwardMsg(
//           {
//             message_type: 'group',
//             group_id
//           },
//           messages
//         ).catch((err) => {
//           logger.ERROR(err)
//           logger.WARNING('发送每日免费游戏失败', { group_id })
//         })
//         await sleep(freegamesConfig.cd * 1000)
//       }
//     },
//     null,
//     true
//   )
// }

import type { allEvents } from '@/global.js'
import { sendForwardMsg, sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'
import { epicApi, steamApi } from './lib.ts'

export default class Bilibili extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: 'freegames',
      params: [{ type: 'enum', enum: ['epic', 'steam', 'all'], default: 'all' }],
      description: 'freegames [epic/steam/all]',
      callback: this.message.bind(this)
    }
  ]

  async message(context: AllHandlers['message']) {
    let messages
    try {
      messages = await this.prepareMessage()
    } catch (error) {
      this.logger.ERROR(`请求接口失败`)
      this.logger.DIR(error)
      await sendMsg(context, [Structs.text('接口请求失败')])
      return
    }

    console.log(messages)

    await sendForwardMsg(context, messages).catch(async () => {
      await sendMsg(context, [Structs.text('发送合并消息失败，可以尝试私聊我哦~')])
    })
  }

  async prepareMessage() {
    const epic = await epicApi()
    const steam = await steamApi()

    const messages = []

    messages.push(Structs.customNode([Structs.text(`今日epic共有${epic.length}个免费游戏~`)]))

    epic.forEach((item) => {
      messages.push(
        Structs.customNode([
          Structs.image(item.description.image),
          Structs.text(
            [
              `游戏名:${item.title}`,
              `开发商:${item.author}`,
              `发行日期:${item.pubDate}`,
              `简介:${item.description.description}`,
              `购买链接:${item.link}`
            ].join('\n')
          )
        ])
      )
    })

    messages.push(Structs.customNode([Structs.text(`今日steam共有${steam.length}个免费游戏~`)]))

    steam.forEach((item) => {
      if (!item.img) return
      messages.push(
        Structs.customNode([
          Structs.image(item.img),
          Structs.text(
            [`游戏名:${item.title}`, `发行日期:${item.releasedTime}`, `购买链接:${item.url}`].join(
              '\n'
            )
          )
        ])
      )
    })

    return messages
  }
}
