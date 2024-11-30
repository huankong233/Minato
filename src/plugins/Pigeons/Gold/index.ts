import type { allEvents, Command } from '@/global.js'
import { cron } from '@/libs/cron.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { sleep } from '@/libs/sleep.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'
import { config } from './config.ts'
import { getGoldPrice } from './request.ts'

export const enable =
  config.boardcast.groups.length !== 0 ||
  config.boardcast.users.length !== 0 ||
  config.changeGroupName.length !== 0

export default class Gold extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '实时金价',
      description: '实时金价 [获取价格/更新群名]',
      params: [
        {
          type: 'enum',
          enum: ['获取价格', '更新群名'],
          default: '获取价格'
        }
      ],
      callback: (context, command) => this.checkGoldPrice(context, command)
    }
  ]

  init = () => cron(config.cron, this.cronSend)

  async checkGoldPrice(context: AllHandlers['message'], command: Command) {
    const action = command.args[0]

    if (action === '更新群名' && context.message_type !== 'group') {
      await sendMsg(context, [Structs.text('只有群聊才能更新群名哦~')])
      return
    }

    const response = await getGoldPrice(this.logger)
    if (!response) {
      await sendMsg(context, [Structs.text('获取金价失败了喵~')])
      return
    }

    const message = [
      Structs.text(
        [
          `金价播报`,
          `开盘价: ${response.open}`,
          `实时金价: ${response.price}`,
          `波动情况: ${response.pricedownPrice}(${response.pricedownPrecent.slice(0, 5)}%)`,
          `买入价格: ${response.buyPrice}`,
          `卖出价格: ${response.sellPrice}`,
          `最高点价: ${response.high}`,
          `最低点价: ${response.low}`
        ].join('\n')
      )
    ]

    if (action === '获取价格') {
      await sendMsg(context, message)
      return
    } else if (action === '更新群名' && context.message_type === 'group') {
      await bot.set_group_name({
        group_id: context.group_id,
        group_name: `实时金价: ${response.price}`
      })
    }
  }

  async cronSend() {
    const { boardcast } = config

    const response = await getGoldPrice(this.logger)
    if (!response) {
      const message = [Structs.text('获取金价失败了喵~')]

      for (const group_id of boardcast.groups) {
        await sendMsg({ message_type: 'group', group_id }, message)
        await sleep(1000)
      }

      for (const user_id of boardcast.users) {
        await sendMsg({ message_type: 'private', user_id }, message)
        await sleep(1000)
      }

      return
    }

    const message = [
      Structs.text(
        [
          `金价播报`,
          `开盘价: ${response.open}`,
          `实时金价: ${response.price}`,
          `波动情况: ${response.pricedownPrice}(${response.pricedownPrecent.slice(0, 5)}%)`,
          `买入价格: ${response.buyPrice}`,
          `卖出价格: ${response.sellPrice}`,
          `最高点价: ${response.high}`,
          `最低点价: ${response.low}`
        ].join('\n')
      )
    ]

    for (const group_id of boardcast.groups) {
      await sendMsg({ message_type: 'group', group_id }, message)
      await sleep(1000)
    }

    for (const user_id of boardcast.users) {
      await sendMsg({ message_type: 'private', user_id }, message)
      await sleep(1000)
    }
  }
}
