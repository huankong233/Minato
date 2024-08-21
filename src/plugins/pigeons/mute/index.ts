import { eventReg } from '@/libs/eventReg.ts'
import { MessageHandler, Structs } from 'node-napcat-ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { config } from './config.ts'
import { randomInt } from '@/libs/random.ts'

export default class Mute {
  async init() {
    eventReg({
      type: 'command',
      commandName: '鸽了',
      description: '咕咕咕~',
      pluginName: 'mute',
      callback: (context) => this.mute(context)
    })
  }

  async mute(context: MessageHandler['message']) {
    if (context.message_type === 'private') {
      await sendMsg(context, [Structs.text({ text: '爬爬爬，私聊来找茬是吧' })])
      return
    }

    const { user_id, group_id } = context

    const userInfo = await bot.get_group_member_info({ group_id, user_id })
    const selfInfo = await bot.get_group_member_info({ group_id, user_id: context.self_id })

    if (selfInfo.role !== 'admin' && selfInfo.role !== 'owner') {
      await sendMsg(context, [
        Structs.text({ text: [`(｀д′)管理！快给我上管理！(大声)`].join('\n') })
      ])
      return
    }

    if (userInfo.role !== 'member') {
      await sendMsg(context, [
        Structs.text({
          text: `╭(╯^╰)╮ 快来人给他把${userInfo.role === 'admin' ? '管理员' : '群主'}下了！！`
        })
      ])
      return
    }

    const muteTime = randomInt(...config.time)

    await bot
      .set_group_ban({
        group_id,
        user_id,
        duration: muteTime
      })
      .then(async () => {
        await sendMsg(context, [
          Structs.text({
            text: '还鸽不鸽了(•ิ_•ิ)'
          })
        ])
      })
      .catch(async () => {
        await sendMsg(context, [Structs.text({ text: '禁言失败~(￣^￣)' })])
      })
  }
}
