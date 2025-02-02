import { type allEvents, type Command, type Pigeon } from '@/global.js'
import { getUserName } from '@/libs/api.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { type AllHandlers, Structs } from 'node-napcat-ts'

export default class Query extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '我的鸽子',
      description: '我的鸽子 [查询的QQ号]',
      params: [{ type: 'number', default: '-1' }],
      callback: this.query.bind(this),
    },
    {
      type: 'command',
      commandName: '查鸽子',
      description: '查鸽子 [查询的QQ号]',
      params: [{ type: 'number', default: '-1' }],
      callback: this.query.bind(this),
    },
    {
      type: 'command',
      commandName: '鸽子排名',
      description: '鸽子排名 [asc/desc]',
      params: [{ type: 'enum', enum: ['asc', 'desc'], default: 'desc' }],
      callback: this.rankList.bind(this),
    },
  ]

  async query(context: AllHandlers['message'], command: Command) {
    const query = command.args[0]
    const user_id = query === '-1' ? context.user_id : parseInt(query)
    context.user_id = user_id

    const username = await getUserName(context)
    const userData = await knex<Pigeon>('pigeons').where({ user_id }).first()
    if (!userData) {
      await sendMsg(context, [Structs.text(`用户 ${username}(${user_id}) 咱不认识哦~`)])
      return
    }

    await sendMsg(context, [Structs.text(`用户 ${username}(${user_id}) 有 ${userData.pigeon_num} 只鸽子`)])
  }

  async rankList(context: AllHandlers['message'], command: Command) {
    const order = command.args[0]
    const pigeons = await knex<Pigeon>('pigeons').orderBy('pigeon_num', order).limit(10)
    if (pigeons.length === 0) {
      await sendMsg(context, [Structs.text('还没有用户哦~')])
    } else {
      const board = ['排行榜:']

      for (const [index, item] of pigeons.entries()) {
        const pos = (index + 1).toString().padStart(2, '0')
        const username = await getUserName({ user_id: item.user_id })
        board.push(`第${pos}名 名字:${username} 拥有 ${item.pigeon_num} 只鸽子`)
      }

      await sendMsg(context, [Structs.text(board.join('\n'))])
    }
  }
}
