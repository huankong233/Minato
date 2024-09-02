import type { allEvents, Command } from '@/global.js'
import { cron } from '@/libs/cron.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { sleep } from '@/libs/sleep.ts'
import { BasePlugin } from '@/plugins/base.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'
import { config } from './config.ts'
import { getGoldPrice } from './request.ts'

export const enable =
  config.broadcast.groups.length !== 0 ||
  config.broadcast.users.length !== 0 ||
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
      callback: (context, command) => this.checkGoldPrice(false, context, command)
    }
  ]

  init = () => cron(config.cron, () => this.checkGoldPrice())

  async checkGoldPrice(isCron = true, context?: AllHandlers['message'], command?: Command) {
    let action = '获取价格'
    if (command) action = command.args[0]

    const response = await getGoldPrice(this.logger)
    if (!response) {
      const message = [Structs.text('获取金价失败了喵~')]

      if (action === '获取价格' && context) {
        await sendMsg(context, message)
        return
      }

      if (action === '更新群名' || isCron) {
        for (const group_id of config.changeGroupName) {
          await bot.set_group_name({
            group_id,
            group_name: `黄金导购群: 获取金价失败了喵~`
          })
          await sleep(1000)
        }
      }

      if (isCron) {
        const { broadcast } = config
        for (const group_id of broadcast.groups) {
          await sendMsg({ message_type: 'group', group_id }, message)
          await sleep(1000)
        }

        for (const user_id of broadcast.users) {
          await sendMsg({ message_type: 'private', user_id }, message)
          await sleep(1000)
        }
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

    if (action === '获取价格' && context) {
      await sendMsg(context, message)
      return
    }

    if (action === '更新群名' || isCron) {
      for (const group_id of config.changeGroupName) {
        await bot.set_group_name({
          group_id,
          group_name: `黄金导购群: ${response.price}`
        })
        await sleep(1000)
      }
    }

    if (isCron) {
      const { broadcast } = config

      for (const group_id of broadcast.groups) {
        await sendMsg({ message_type: 'group', group_id }, message)
        await sleep(1000)
      }

      for (const user_id of broadcast.users) {
        await sendMsg({ message_type: 'private', user_id }, message)
        await sleep(1000)
      }
    }
  }
}
