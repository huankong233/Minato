import type { allEvents, Pigeon, PigeonHistory } from '@/global.js'
import { randomInt } from '@/libs/random.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { isBeforeToday } from '@/libs/time.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import pigeonTool from '@/plugins/Pigeons/PigeonTool/index.ts'
import { type AllHandlers, Structs } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Gugu extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      description: '咕咕咕',
      commandName: /咕咕/,
      callback: Gugu.gugu.bind(this),
    },
  ]

  static async gugu(context: AllHandlers['message']) {
    const user = await knex<Pigeon>('pigeons')
      .where({
        user_id: context.user_id,
      })
      .first()

    if (!user) {
      await knex<Pigeon>('pigeons').insert({ user_id: context.user_id })
      await pigeonTool.add(context, config.newUserAdd, '首次咕咕')
      await sendMsg(context, [Structs.text(`首次咕咕~赠送${config.newUserAdd}只鸽子~`)])
      await Gugu._gugu(context)
      return
    }

    const userData = await knex<PigeonHistory>('pigeon_histories')
      .where({
        user_id: context.user_id,
        reason: '每日咕咕',
      })
      .orderBy('created_at', 'desc')
      .first()

    if (userData && !isBeforeToday(userData.created_at.getTime())) {
      await sendMsg(context, [Structs.text('咕咕失败~今天已经咕咕过了哦~')])
      return
    }

    await Gugu._gugu(context)
  }

  private static async _gugu(context: AllHandlers['message']) {
    //获得的鸽子数
    const addon = randomInt(1, config.oldUserAdd)
    await pigeonTool.add(context, addon, '每日咕咕')
    await sendMsg(context, [Structs.text(`咕咕成功~获得${addon}只鸽子~`)])
  }
}
