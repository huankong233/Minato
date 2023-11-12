import type { CQEvent } from '@huan_kong/go-cqwebsocket'
import type { commandFormat } from '@/libs/eventReg.ts'
import { add, reduce } from '@/plugins/pigeon/pigeon/index.ts'
import { eventReg } from '@/libs/eventReg.ts'
import { missingParams } from '@/libs/eventReg.ts'
import { getRangeCode, randomInt } from '@/libs/random.ts'
import { replyMsg } from '@/libs/sendMsg.ts'
import { jsonc } from 'jsonc'

export default async () => {
  event()

  //刷新红包列表
  await freshRedPacketList()
}

//注册事件
function event() {
  eventReg('message', async ({ context }, command) => {
    await get(context)

    if (!command) return

    if (command.name === '鸽子红包') {
      await give(context, command)
    } else if (command.name === '剩余红包') {
      await getAll(context)
    }
  })
}

//我的鸽子
async function give(context: CQEvent<'message'>['context'], command: commandFormat) {
  const { user_id } = context

  if (await missingParams(context, command, 2)) return

  const { params } = command

  //发送的红包数
  const redPacket_num = parseInt(params[0])
  //鸽子数
  const pigeon_num = parseInt(params[1])
  //口令
  const code = params[2] ?? getRangeCode()

  if (redPacket_num <= 0 || pigeon_num <= 0) {
    return await replyMsg(context, '红包发送失败,红包数量和鸽子数都不能<=0', { reply: true })
  }

  const item = await database.select('*').where({ code }).from('red_packet').first()
  if (item) return await replyMsg(context, '红包发送失败,该口令已存在', { reply: true })

  //校验合理性
  const pre = pigeon_num / redPacket_num

  if (pre < 1) {
    return await replyMsg(context, '红包发送失败,每个包需要至少一只鸽子', { reply: true })
  }

  if (Math.floor(pre) !== pre) {
    return await replyMsg(context, '红包发送失败,每个包里的鸽子数需要为整数', { reply: true })
  }

  if (!(await reduce(user_id, pigeon_num, `发送鸽子红包_${code}`))) {
    return await replyMsg(context, '红包发送失败,账户鸽子不足', { reply: true })
  }

  //插入红包
  await database
    .insert({
      send_user_id: user_id,
      redPacket_num,
      pigeon_num,
      code,
      picked_user: '[]'
    })
    .into('red_packet')

  //更新红包列表
  await freshRedPacketList()
  await replyMsg(context, `富哥发红包了!口令:${code}`)
}

async function get(context: CQEvent<'message'>['context']) {
  const { user_id, message } = context
  const { redPacketData } = global.data as { redPacketData: redPacketData }
  const { redPackets } = redPacketData

  for (let i = 0; i < redPackets.length; i++) {
    const item = redPackets[i]
    const { pigeon_num, redPacket_num, picked_user } = item

    //口令不正确
    if (message !== item.code) continue

    //领取过
    const pickedUserJSON = jsonc.parse(picked_user)
    if (pickedUserJSON.indexOf(user_id) !== -1) {
      await replyMsg(context, '红包领取过了哦,不要贪心啦~', { reply: true })
      continue
    }

    //判断剩余红包数(如果剩余1个,全部拿走)
    const getPigeonNum =
      redPacket_num === 1 ? pigeon_num : randomInt(1, (pigeon_num * randomInt(50, 70)) / 100)

    pickedUserJSON.push(user_id)

    await add(user_id, getPigeonNum, `领取鸽子红包_${item.code}`)

    await database
      .update({
        redPacket_num: redPacket_num - 1,
        pigeon_num: pigeon_num - getPigeonNum,
        picked_user: jsonc.stringify(pickedUserJSON)
      })
      .where('id', item.id)
      .from('red_packet')

    await replyMsg(context, `红包${item.code}领取成功,获得${getPigeonNum}只鸽子~`, {
      reply: true
    })
  }

  //更新红包列表
  await freshRedPacketList()
}

async function getAll(context: CQEvent<'message'>['context']) {
  const { redPacketData } = global.data as { redPacketData: redPacketData }
  const { redPackets } = redPacketData
  if (redPackets.length === 0) {
    return await replyMsg(context, '暂时还没有红包哦~要不你发一个?', { reply: true })
  }

  let msg = ['剩余红包:']

  for (let i = 0; i < redPackets.length; i++) {
    const item = redPackets[i]
    msg.push(
      [
        '由',
        await bot.get_stranger_info(item.send_user_id).then(res => res.nickname),
        '发送的口令: ',
        item.code,
        ' ,剩余',
        item.pigeon_num,
        '只鸽子'
      ].join()
    )
  }

  await replyMsg(context, msg.join('\n'), { reply: true })
}

async function freshRedPacketList() {
  const { redPacketData } = global.data as { redPacketData: redPacketData }
  redPacketData.redPackets = await database
    .select('*')
    .where('pigeon_num', '>', 0)
    .from('red_packet')
}
