import type { allEvents, Pigeon } from '@/global.js'
import { randomInt } from '@/libs/random.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { isBeforeToday } from '@/libs/time.ts'
import { BasePlugin } from '@/plugins/base.ts'
import pigeonTool from '@/plugins/pigeons/pigeonTool/index.ts'
import { type AllHandlers, Structs } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Gugu extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      description: '咕咕咕',
      commandName: /咕咕咕/,
      callback: Gugu.gugu.bind(this)
    }
  ]

  static async gugu(context: AllHandlers['message']) {
    const userData = await knex<Pigeon>('pigeons').where({ user_id: context.user_id }).first()
    if (!userData) {
      await knex<Pigeon>('pigeons').insert({ user_id: context.user_id })
      await pigeonTool.add(context, config.newUserAdd, '首次咕咕')
      await sendMsg(context, [Structs.text(`首次咕咕~赠送${config.newUserAdd}只鸽子~`)])
      await this._gugu(context)
      return
    }

    if (!isBeforeToday(userData.updated_at.getTime())) {
      await sendMsg(context, [Structs.text('咕咕失败~今天已经咕咕过了哦~')])
      return
    }

    await this._gugu(context)
  }

  private static async _gugu(context: AllHandlers['message']) {
    //获得的鸽子数
    const addon = randomInt(1, config.oldUserAdd)
    await pigeonTool.add(context, addon, '每日咕咕')
    await sendMsg(context, [Structs.text(`咕咕成功~获得${addon}只鸽子~`)])
  }
}
