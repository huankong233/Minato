import type { allEvents, Command } from '@/global.js'
import { cron } from '@/libs/cron.ts'
import { sendForwardMsg, sendMsg } from '@/libs/sendMsg.ts'
import { sleep } from '@/libs/sleep.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'
import { config } from './config.ts'
import { epicApi, steamApi } from './lib.ts'

export default class FreeGames extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: 'freegames',
      params: [{ type: 'enum', enum: ['epic', 'steam', 'all'], default: 'all' }],
      description: 'freegames [epic/steam/all]',
      callback: this.message.bind(this),
    },
  ]

  groups: { group_id: number; type: 'epic' | 'steam' | 'all' }[] = []

  async init() {
    // 整理通知
    config.groups.forEach((group) => {
      if (typeof group === 'number') {
        this.groups.push({ group_id: group, type: 'all' })
      } else {
        this.groups.push(group)
      }
    })

    cron(config.crontab, async () => {
      this.groups.forEach(async (group) => {
        const messages = await this.prepareMessage(group.type)
        await sendForwardMsg({ message_type: 'group', group_id: group.group_id }, messages)
        await sleep(config.cd)
      })
    })
  }

  async message(context: AllHandlers['message'], command: Command) {
    const type = command.args[0] as 'epic' | 'steam' | 'all'
    let messages
    try {
      messages = await this.prepareMessage(type)
    } catch (error) {
      this.logger.ERROR(`请求接口失败`)
      this.logger.DIR(error, false)
      await sendMsg(context, [Structs.text('接口请求失败')])
      return
    }

    await sendForwardMsg(context, messages).catch(async () => {
      await sendMsg(context, [Structs.text('发送合并消息失败，可以尝试私聊我哦~')])
    })
  }

  async prepareMessage(type: 'epic' | 'steam' | 'all') {
    const messages = []

    if (type === 'epic' || type === 'all') {
      try {
        const epic = await epicApi()
        messages.push(Structs.customNode([Structs.text(`今日epic共有${epic.length}个免费游戏~`)]))
        epic.forEach((item) => {
          messages.push(
            Structs.customNode([
              Structs.image(item.description.image),
              Structs.text(
                [
                  `游戏名: ${item.title}`,
                  `开发商: ${item.author}`,
                  `截止日期: ${item.endDate}`,
                  `简介: ${item.description.description}`,
                  `购买链接: ${item.link}`,
                ].join('\n'),
              ),
            ]),
          )
        })
      } catch (_error) {
        messages.push(Structs.customNode([Structs.text(`epic获取免费游戏失败~`)]))
      }
    }

    if (type === 'steam' || type === 'all') {
      try {
        const steam = await steamApi()

        messages.push(Structs.customNode([Structs.text(`今日steam共有${steam.length}个免费游戏~`)]))

        steam.forEach((item) => {
          if (!item.img) return
          messages.push(
            Structs.customNode([
              Structs.image(item.img),
              Structs.text([`游戏名: ${item.title}`, `发行日期: ${item.releasedTime}`, `购买链接: ${item.url}`].join('\n')),
            ]),
          )
        })
      } catch (_error) {
        messages.push(Structs.customNode([Structs.text(`steam获取免费游戏失败~`)]))
      }
    }

    return messages
  }
}
