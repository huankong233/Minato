import type { allEvents } from '@/global.js'
import { randomInt } from '@/libs/random.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Mute extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '鸽了',
      description: '鸽了',
      callback: this.mute.bind(this),
    },
  ]

  async mute(context: AllHandlers['message']) {
    if (context.message_type === 'private') {
      await sendMsg(context, [Structs.text('爬爬爬，私聊来找茬是吧')])
      return
    }

    const { user_id, group_id } = context

    const userInfo = context.sender
    const selfInfo = await bot.get_group_member_info({ group_id, user_id: context.self_id })

    if (selfInfo.role !== 'admin' && selfInfo.role !== 'owner') {
      await sendMsg(context, [Structs.text([`(｀д′)管理！快给我上管理！(大声)`].join('\n'))])
      return
    }

    if (userInfo.role !== 'member') {
      await sendMsg(context, [Structs.text(`╭(╯^╰)╮ 快来人给他把${userInfo.role === 'admin' ? '管理员' : '群主'}下了！！`)])
      return
    }

    const muteTime = randomInt(...config.time)

    await bot
      .set_group_ban({
        group_id,
        user_id,
        duration: muteTime,
      })
      .then(async () => {
        await sendMsg(context, [Structs.text('还鸽不鸽了(•ิ_•ิ)')])
      })
      .catch(async () => {
        await sendMsg(context, [Structs.text('禁言失败~(￣^￣)')])
      })
  }
}
