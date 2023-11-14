import type { commandFormat } from '@/libs/eventReg.ts'
import type { botConfig } from '@/plugins/builtInPlugins/bot/config.d.ts'
import type { CQEvent } from '@huan_kong/go-cqwebsocket'
import type { fakeContext } from '@/global.d.ts'
import { eventReg, missingParams } from '@/libs/eventReg.ts'
import { sendMsg, replyMsg } from '@/libs/sendMsg.ts'
import { getUserName } from '@/libs/Api.ts'

export default async () => {
  event()
}

/**
 * 加群 = 请求加群
 * 入群 = 邀请入群
 */

function event() {
  eventReg('notice', async ({ context }) => {
    await notice(context)
  })

  eventReg('request', async ({ context }) => {
    await request(context)
  })

  eventReg('message', async ({ context }, command) => {
    if (!command) return

    switch (command.name) {
      case '入群':
        return await invite(context, command)
      case '加群':
        return await invite(context, command)
      case '好友':
        return await friend(context, command)
    }
  })
}

//notice事件处理
async function notice(context: CQEvent<'notice'>['context']) {
  const { notice_type } = context

  if (notice_type === 'group_increase' || notice_type === 'group_decrease') {
    const { user_id, group_id, sub_type } = context
    const fakeContext: fakeContext = {
      message_type: 'group',
      user_id,
      group_id
    }

    if (sub_type === 'approve') {
      await replyMsg(fakeContext, `${await getUserName(user_id)} 欢迎加群呀~ ヾ(≧▽≦*)o`)
    } else if (sub_type === 'leave') {
      await replyMsg(fakeContext, `${await getUserName(user_id)} 退群了 (*>.<*)`)
    }
  }
}

//request事件处理
async function request(context: CQEvent<'request'>['context']) {
  const { request_type } = context
  const { adminConfig } = global.config as { adminConfig: adminConfig }

  if (request_type === 'group') {
    const { sub_type } = context
    if (sub_type === 'add') {
      //申请加群
      await sendNotice(context, '加群', adminConfig.add.agree)
      if (adminConfig.add.agree) {
        await invite(context, { name: '加群', params: ['批准', context.flag] })
      }
    } else if (sub_type === 'invite') {
      //邀请机器人入群
      await sendNotice(context, '入群', adminConfig.invite.agree)
      if (adminConfig.invite.agree) {
        await invite(context, { name: '入群', params: ['批准', context.flag] })
      }
    }
  } else if (request_type === 'friend') {
    //添加好友
    await sendNotice(context, '好友', adminConfig.friend.agree)
    if (adminConfig.friend.agree) {
      await friend(context, { name: 'freind', params: ['批准', context.flag] })
    }
  }
}

//给admin发送通知
async function sendNotice(context: CQEvent<'request'>['context'], name: string, auto = false) {
  const { request_type, flag, user_id, comment } = context
  const { botConfig } = global.config as { botConfig: botConfig }

  let reply = [`用户 : ${user_id}`]

  if (request_type === 'group') {
    const { group_id } = context
    reply.push(`申请${name} : ${group_id}`)
  }

  reply.push(`验证信息 : ${comment}`)

  if (auto) {
    reply.push(`已自动同意了哦~`)
  } else {
    reply.push(`批准回复 : ${botConfig.prefix}${name} 批准 ${flag}`)
    let str = `拒绝回复 : ${botConfig.prefix}${name} 拒绝 ${flag}`
    if (name !== '好友') str += ' 拒绝原因(可选)'
    reply.push(str)
  }

  await sendMsg(botConfig.admin, reply.join('\n'))
}

//同意入群/加群请求
async function invite(
  context: CQEvent<'message'>['context'] | CQEvent<'request'>['context'],
  command: commandFormat
) {
  const { botConfig } = global.config as { botConfig: botConfig }

  if (context.post_type === 'message') {
    // 判断是否为管理员
    if (botConfig.admin !== context.user_id)
      return await replyMsg(context, '你不是咱的管理员喵~', { reply: true })

    if (await missingParams(context, command, 2)) return
  }

  const { name, params } = command

  const approve = params[0] === '批准'
  const flag = params[1]
  const reason = params[2]
  const sub_type = name === '加群' ? 'friend' : 'group'

  await bot
    .set_group_add_request(flag, sub_type, approve, reason)
    .catch(async response => {
      response.status === 'failed'
        ? context.post_type === 'message'
          ? await replyMsg(context, [`执行失败,失败原因:`, `${response.wording}`].join('\n'))
          : await sendMsg(botConfig.admin, [`执行失败,失败原因:`, `${response.wording}`].join('\n'))
        : null
    })
    .finally(async () =>
      context.post_type === 'message' ? await replyMsg(context, '执行成功(不代表处理结果)') : null
    )
}

//同意加好友请求
async function friend(
  context: CQEvent<'message'>['context'] | CQEvent<'request'>['context'],
  command: commandFormat
) {
  const { botConfig } = global.config as { botConfig: botConfig }

  if (context.post_type === 'message') {
    // 判断是否为管理员
    if (botConfig.admin !== context.user_id)
      return await replyMsg(context, '你不是咱的管理员喵~', { reply: true })

    if (await missingParams(context, command, 2)) return
  }

  const { params } = command
  const approve = params[0] === '批准'
  const flag = params[1]

  await bot
    .set_friend_add_request(flag, approve)
    .catch(async response => {
      response.status === 'failed'
        ? context.post_type === 'message'
          ? await replyMsg(context, [`执行失败,失败原因:`, `${response.wording}`].join('\n'))
          : await sendMsg(botConfig.admin, [`执行失败,失败原因:`, `${response.wording}`].join('\n'))
        : null
    })
    .finally(async () =>
      context.post_type === 'message' ? await replyMsg(context, '执行成功(不代表处理结果)') : null
    )
}
