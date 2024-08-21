import { Command } from '@/global.js'
import { eventReg } from '@/libs/eventReg.ts'
import { MessageHandler, Structs } from 'node-napcat-ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { getUserName } from '@/libs/api.ts'

export default class Query {
  async init() {
    eventReg({
      type: 'command',
      commandName: '我的鸽子',
      description: '查询账户有多少鸽子',
      params: [{ type: 'string', default: 'self' }],
      pluginName: 'query',
      callback: (context, command) => this.query(context, command)
    })

    eventReg({
      type: 'command',
      commandName: '查鸽子',
      description: '查询指定账户有多少鸽子',
      params: [{ type: 'string', default: 'self' }],
      pluginName: 'query',
      callback: (context, command) => this.query(context, command)
    })
  }

  async query(context: MessageHandler['message'], command: Command) {
    const query = command.args[0]
    const user_id = query === 'self' ? context.user_id : parseInt(query)
    context.user_id = user_id

    const username = await getUserName(user_id)
    const userData = await Pigeon().where({ user_id }).first()
    if (!userData) {
      await sendMsg(context, [
        Structs.text({
          text: `用户 ${username}(${user_id}) 咱不认识哦~`
        })
      ])
      return
    }

    await sendMsg(context, [
      Structs.text({
        text: `用户 ${username}(${user_id}) 有 ${userData.pigeon_num} 只鸽子`
      })
    ])
  }
}
