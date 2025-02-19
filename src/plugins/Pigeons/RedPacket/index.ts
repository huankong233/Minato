import type { allEvents, Command, RedPacket as RedPacketModel } from '@/global.js'
import { getUserName } from '@/libs/api.ts'
import { randomInt } from '@/libs/random.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import PigeonTool from '@/plugins/Pigeons/PigeonTool/index.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'
import { parse } from 'path'
import type { redPackets } from './config.ts'

export default class RedPacket extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'message',
      callback: this.get.bind(this),
    },
    {
      type: 'message',
      callback: this.message.bind(this),
      priority: 999,
    },
    {
      type: 'command',
      commandName: '发送红包',
      description: '发送红包 (红包个数) (鸽子数) [口令]',
      params: [{ type: 'number' }, { type: 'number' }],
      callback: this.send.bind(this),
    },
    {
      type: 'command',
      commandName: '鸽子红包',
      description: '鸽子红包 (红包个数) (鸽子数) [口令]',
      params: [{ type: 'number' }, { type: 'number' }],
      callback: this.send.bind(this),
    },
    {
      type: 'command',
      commandName: '剩余红包',
      description: '剩余红包',
      callback: this.remaining.bind(this),
    },
  ]

  init = this.freshRedPacketList

  redPackets: redPackets[] = []

  async freshRedPacketList() {
    this.redPackets = (await knex<RedPacketModel>('red_packet').where('pigeon_num', '>', 0)).map((item) => {
      item.code = JSON.parse(item.code)
      item.picked_user = JSON.parse(item.picked_user)
      return item as unknown as redPackets
    })
  }

  sender: {
    [key: number]: {
      context: AllHandlers['message']
      context2?: AllHandlers['message']
      packet_num: number
      pigeon_num: number
      level: 1 | 2
    }
  } = {}

  async send(context: AllHandlers['message'], command: Command) {
    const packet_num = Number(command.args[0])
    const pigeon_num = Number(command.args[1])

    if (packet_num <= 0 || pigeon_num <= 0) {
      await sendMsg(context, [Structs.text('红包发送失败,红包数量和鸽子数都不能小于等于0')])
      return
    }

    //校验合理性
    const pre = pigeon_num / packet_num

    if (pre < 1) {
      await sendMsg(context, [Structs.text('红包发送失败,每个包需要至少一只鸽子')])
      return
    }

    if (Math.floor(pre) !== pre) {
      await sendMsg(context, [Structs.text('红包发送失败,每个包里的鸽子数需要为整数')])
      return
    }

    this.sender[context.user_id] = {
      context,
      pigeon_num,
      packet_num,
      level: 1,
    }

    await sendMsg(context, [Structs.text('请输入红包口令,口令可以是任意文本、图片节点\n输入 "退出" 取消发送')])
  }

  async message(context: AllHandlers['message']) {
    const isAdd = this.sender[context.user_id]
    const firstMessage = context.message[0]
    const isQuit = firstMessage.type === 'text' && firstMessage.data.text === '退出'

    if (!isAdd) return
    if (isQuit) {
      delete this.sender[context.user_id]
      await sendMsg(context, [Structs.text('已取消发送红包')])
      return 'quit'
    }

    if (isAdd.level === 1) {
      const avaliableNodes = context.message.filter((item) => item.type === 'text' || item.type === 'face' || item.type === 'image')

      if (avaliableNodes.length !== context.message.length) {
        await sendMsg(context, [Structs.text('红包发送失败,只支持文本、图片节点')])
        return 'quit'
      }

      const code = JSON.stringify(context.message)

      const item = await knex<RedPacketModel>('red_packet').where({ code }).first()
      if (item) {
        await sendMsg(context, [Structs.text('红包发送失败,该口令已存在')])
        return 'quit'
      }

      isAdd.context2 = context
      isAdd.level = 2

      await sendMsg(context, [Structs.text('确定要发送红包吗?[Y/N]')])
    } else if (isAdd.level === 2) {
      const oper = firstMessage.type === 'text' && firstMessage.data.text.toUpperCase() === 'Y'
      if (!oper) {
        delete this.sender[context.user_id]
        await sendMsg(context, [Structs.text('已取消发送红包')])
        return 'quit'
      }

      const { pigeon_num, packet_num } = isAdd
      const code = JSON.stringify(isAdd.context2!.message)

      const enough = await PigeonTool.reduce(context, pigeon_num, `发送鸽子红包_${code}`)
      if (!enough) {
        await sendMsg(context, [Structs.text('红包发送失败,账户鸽子不足')])
        delete this.sender[context.user_id]
        return 'quit'
      }

      await knex<RedPacketModel>('red_packet').insert({
        user_id: context.user_id,
        packet_num,
        pigeon_num,
        code,
        picked_user: '[]',
      })

      //更新红包列表
      await this.freshRedPacketList()
      await sendMsg(context, [Structs.text(`红包发送成功!口令:${code}`)])
      delete this.sender[context.user_id]
      return 'quit'
    }
  }

  async get(context: AllHandlers['message']) {
    for (const [_index, item] of this.redPackets.entries()) {
      if (item.code.length !== context.message.length) continue

      let success = true
      for (const [index, node] of item.code.entries()) {
        if (node.type !== context.message[index].type) {
          success = false
        }

        if (node.type === 'text' && context.message[index].type === 'text' && node.data.text !== context.message[index].data.text) {
          success = false
        }

        if (node.type === 'face' && context.message[index].type === 'face' && node.data.id !== context.message[index].data.id) {
          success = false
        }

        if (node.type === 'image' && context.message[index].type === 'image' && parse(node.data.file).name !== parse(context.message[index].data.file).name) {
          success = false
        }
      }

      if (!success) continue

      const { packet_num, pigeon_num, picked_user } = item

      if (picked_user.indexOf(context.user_id) !== -1) {
        await sendMsg(context, [Structs.text('红包领取过了哦,不要贪心啦~')])
        continue
      }

      //判断剩余红包数(如果剩余1个,全部拿走)
      const get_pigeon_num = packet_num === 1 ? pigeon_num : randomInt(1, (pigeon_num * randomInt(50, 70)) / 100)

      picked_user.push(context.user_id)

      await PigeonTool.add(context, get_pigeon_num, `领取鸽子红包_${item.code}`)

      await knex<RedPacketModel>('red_packet')
        .where('id', item.id)
        .update({
          packet_num: packet_num - 1,
          pigeon_num: pigeon_num - get_pigeon_num,
          picked_user: JSON.stringify(picked_user),
        })

      await this.freshRedPacketList()
      await sendMsg(context, [Structs.text(`红包${JSON.stringify(item.code)}领取成功,恭喜你领取了${get_pigeon_num}只鸽子!`)])

      return
    }
  }

  async remaining(context: AllHandlers['message']) {
    if (this.redPackets.length === 0) {
      await sendMsg(context, [Structs.text('暂时还没有红包哦~要不你发一个?')])
      return
    }

    const msg = ['剩余红包:']

    for (let i = 0; i < this.redPackets.length; i++) {
      const item = this.redPackets[i]
      const username = await getUserName({ user_id: item.user_id })
      msg.push(`由${username}发送的口令: ${JSON.stringify(item.code)} ,剩余: ${item.pigeon_num} 只鸽子`)
    }

    await sendMsg(context, [Structs.text(msg.join('\n'))])
  }
}
