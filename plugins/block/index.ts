import type { commandFormat } from '@/libs/eventReg.ts'
import type { CQEvent } from '@huan_kong/go-cqwebsocket'
import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger } from '@/libs/logger.ts'
import { replyMsg } from '@/libs/sendMsg.ts'

const logger = makeLogger({ pluginName: 'block' })

export default () => {
  event()
}

function event() {
  eventReg('message', async ({ context }, command) => await checkBan(context, command), 102)
  eventReg('notice', async ({ context }) => await checkBan(context), 102)
  eventReg('request', async ({ context }) => await checkBan(context), 102)
}

async function checkBan(
  context:
    | CQEvent<'message'>['context']
    | CQEvent<'notice'>['context']
    | CQEvent<'request'>['context'],
  command?: commandFormat | false
) {
  const { blockConfig } = global.config as { blockConfig: blockConfig }

  const { user_id, group_id } = context as any
  if (user_id || user_id) return

  if (blockConfig.blockUsers.includes(user_id)) {
    if (debug) logger.DEBUG(`用户 ${user_id} 处于黑名单中`)
    return 'quit'
  }

  if (blockConfig.blockGroups.includes(group_id)) {
    if (debug) logger.DEBUG(`群组 ${group_id} 处于黑名单中`)
    return 'quit'
  }

  if (!command) return

  if (context.post_type === 'message' && context.sub_type === 'normal') {
    const { group_id } = context
    for (let i = 0; i < blockConfig.blockedCommands.length; i++) {
      const element = blockConfig.blockedCommands[i]

      if (element.groupId !== '*' && !element.groupId.includes(group_id)) {
        continue
      }
      if (command.name.match(element.regexp)) {
        if (element.reply !== '') await replyMsg(context, element.reply ?? blockConfig.defaultReply)
        if (debug) logger.DEBUG(`群组 ${group_id} 的命令 ${element.regexp} 处于黑名单中`)
        return 'quit'
      }
    }
  }
}
