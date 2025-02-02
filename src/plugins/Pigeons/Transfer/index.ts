import { type allEvents, type Command } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import PigeonTool from '@/plugins/Pigeons/PigeonTool/index.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'

export default class Transfer extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '鸽子转账',
      description: '鸽子转账 [转账的QQ号] [转账的数目]',
      params: [{ type: 'number' }, { type: 'number' }],
      callback: this.transfer.bind(this),
    },
  ]

  async transfer(context: AllHandlers['message'], command: Command) {
    const { user_id } = context
    const from = user_id
    const to = parseFloat(command.args[0])

    if (from === to) {
      await sendMsg(context, [Structs.text('不可以给自己转账哦~')])
      return
    }

    //转账多少只
    const num = parseFloat(command.args[1])

    if (num <= 0) {
      await sendMsg(context, [Structs.text('转账金额不能小于等于0哦~')])
      return
    }

    const to_data = await PigeonTool.getUserData(context, false)

    if (!to_data) {
      await sendMsg(context, [Structs.text('转账对象不存在~')])
      return
    }

    if (!(await PigeonTool.reduce(context, num, `转账给${to}`))) {
      await sendMsg(context, [Structs.text('转账失败,账户鸽子不足~')])
      return
    }

    await PigeonTool.add({ ...context, user_id: to }, num, `转账来自${from}`)

    await sendMsg(context, [Structs.text('转账成功~')])
  }
}
