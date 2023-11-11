import { CQEvent } from '@huan_kong/go-cqwebsocket'
import { eventReg } from '@/libs/eventReg.ts'
import { mute } from '../mute/index.ts'
import { replyMsg } from '@/libs/sendMsg.ts'
import { randomInt } from '@/libs/random.ts'
import type { fakeContext } from '@/global.ts'

export default () => {
  event()
}

function event() {
  eventReg('notice', async ({ context }) => {
    if (
      'group_id' in context &&
      context.notice_type === 'notify' &&
      context.sub_type === 'poke' &&
      context.post_type === 'notice' &&
      context.target_id === context.self_id
    ) {
      await poke(context)
    }
  })
}

//戳一戳
async function poke(context: CQEvent<'notice.notify.poke.group'>['context']) {
  const { group_id, user_id, self_id } = context
  const { pokeConfig } = global.config as { pokeConfig: pokeConfig }
  const { pokeData } = global.data as { pokeData: pokeData }

  const fakeContext: fakeContext = { user_id, group_id, self_id, message_type: 'group' }

  //增加计数
  if (!pokeData.count) pokeData.count = {}
  if (!pokeData.count[user_id]) pokeData.count[user_id] = 0

  if (randomInt(0, 100) <= pokeConfig.banProb) {
    pokeData.count[user_id]++
  }

  let replyed = false

  if (pokeData.count[user_id] >= pokeConfig.banCount) {
    pokeData.count[user_id] = 0

    const data = await mute(fakeContext, false, pokeConfig.banTime)
    if (data) {
      //禁言成功
      replyed = true
      return await replyMsg(
        fakeContext,
        pokeConfig.banReply[randomInt(0, pokeConfig.banReply.length - 1)]
      )
    }
  }

  //回复
  if (!replyed)
    await replyMsg(fakeContext, pokeConfig.reply[randomInt(0, pokeConfig.reply.length - 1)])
}
