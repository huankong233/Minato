import { eventReg } from '@/libs/eventReg.ts'
import { randomInt } from '@/libs/random.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { isBeforeToday } from '@/libs/time.ts'
import pigeonTool from '@/plugins/pigeons/pigeonTool/index.ts'
import { MessageHandler, Structs } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Gugu {
  async init() {
    eventReg({
      type: 'command',
      description: '咕咕咕',
      commandName: /咕咕咕/,
      pluginName: 'gugu',
      callback: (context) => Gugu.gugu(context)
    })
  }

  static async gugu(context: MessageHandler['message']) {
    const userData = await Pigeon().where({ user_id: context.user_id }).first()
    if (!userData) {
      await Pigeon().insert({ user_id: context.user_id })
      await pigeonTool.add(context, config.newUserAdd, '首次咕咕')
      await sendMsg(context, [Structs.text({ text: `首次咕咕~赠送${config.newUserAdd}只鸽子~` })])
      await this._gugu(context)
      return
    }

    if (!isBeforeToday(userData.updated_at.getTime())) {
      await sendMsg(context, [Structs.text({ text: '咕咕失败~今天已经咕咕过了哦~' })])
      return
    }

    await this._gugu(context)
  }

  private static async _gugu(context: MessageHandler['message']) {
    //获得的鸽子数
    const addon = randomInt(1, config.oldUserAdd)
    await pigeonTool.add(context, addon, '每日咕咕')
    await sendMsg(context, [Structs.text({ text: `咕咕成功~获得${addon}只鸽子~` })])
  }
}
