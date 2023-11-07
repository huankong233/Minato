import { CQEvent } from '@huan_kong/go-cqwebsocket'
import { getUserData } from '@/plugins/pigeon/pigeon/index.ts'
import { replyMsg } from '@/libs/sendMsg.ts'
import { commandFormat, eventReg } from '@/libs/eventReg.ts'

export default () => {
  event()
}

//注册事件
function event() {
  eventReg('message', async ({ context }, command) => {
    if (!command) return

    const { name } = command
    if (name === '我的鸽子') {
      await query(context)
    } else if (name === '查鸽子') {
      await query(context, command)
    } else if (name === '鸽子排行榜') {
      await rankingList(context)
    }
  })
}

//我的鸽子
async function query(context: CQEvent<'message'>['context'], command?: commandFormat) {
  let { user_id } = context

  if (command && command.params.length > 0) {
    user_id = parseInt(command.params[0])
  }

  const userData = await getUserData(user_id)
  const username = await bot.get_stranger_info(user_id).then(res => res.nickname)

  if (!userData) return await replyMsg(context, `${username}是谁呀,咱不认识呢~`, { reply: true })

  await replyMsg(context, `用户${username}拥有${userData.pigeon_num}只鸽子`, {
    reply: true
  })
}

async function rankingList(context: CQEvent<'message'>['context']) {
  // 鸽子排行榜
  const data = await database
    .from('pigeon')
    .limit(10)
    .orderBy([{ column: 'pigeon_num', order: 'DESC' }])

  if (data.length === 0) {
    await replyMsg(context, '还没有用户哦~', { reply: true })
  } else {
    let board = ['排行榜:']
    await Promise.all(
      data.map(async (value, i) => {
        const index = (i + 1).toString().padStart(2, '0')
        const username = await bot.get_stranger_info(value.user_id).then(res => res.nickname)
        board.push(`第${index}名 名字:"${username}" 拥有${value.pigeon_num}只鸽子`)
      })
    )
    await replyMsg(context, board.join('\n'), { reply: true })
  }
}
