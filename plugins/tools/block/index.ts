import type { botConfig } from '@/plugins/builtInPlugins/bot/config.d.ts'
import { commandFormat } from '@/libs/eventReg.ts'
import { eventReg, missingParams } from '@/libs/eventReg.ts'
import { getDir } from '@/libs/getDirName.ts'
import { makeLogger } from '@/libs/logger.ts'
import fs from 'fs'
import { jsonc } from 'jsonc'
import path from 'path'
import { SocketHandle } from 'node-open-shamrock'
import { quickOperation } from '@/libs/sendMsg.ts'

const logger = makeLogger({ pluginName: 'block' })

export default () => {
  event()
}

function event() {
  eventReg('message', async (context, command) => await checkBan(context, command), 102)
  eventReg('notice', async context => await checkBan(context), 102)
  eventReg('request', async context => await checkBan(context), 102)

  eventReg('message', async (context, command) => {
    if (!command) return

    if (command.name === '拉黑') {
      await ban(context, command)
    } else if (command.name === '解除拉黑') {
      await unban(context, command)
    }
  })
}

async function checkBan(
  context: SocketHandle['message'] | SocketHandle['notice'] | SocketHandle['request'],
  command?: commandFormat | false
) {
  const { blockConfig } = global.config as { blockConfig: blockConfig }

  if ('user_id' in context) {
    const { user_id } = context
    if (blockConfig.blockUsers.includes(user_id)) {
      if (debug) logger.DEBUG(`用户 ${user_id} 处于黑名单中`)
      return 'quit'
    }
  }

  if ('group_id' in context) {
    const { group_id } = context
    if (blockConfig.blockGroups.includes(group_id)) {
      if (debug) logger.DEBUG(`群组 ${group_id} 处于黑名单中`)
      return 'quit'
    }
  }

  if (!command) return

  if (context.post_type === 'message') {
    for (let i = 0; i < blockConfig.blockedCommands.length; i++) {
      const element = blockConfig.blockedCommands[i]

      // 白名单优先
      if ('user_id' in context) {
        const { user_id } = context
        if (element.whiteUser) {
          if (element.whiteUser === '*' || element.whiteUser.includes(user_id)) {
            continue
          } else {
            if ((await check(context, command, element, blockConfig.defaultReply)) === 'quit') {
              return 'quit'
            }
          }
        }

        if (element.blackUser) {
          if (element.blackUser === '*' || element.blackUser.includes(user_id)) {
            if ((await check(context, command, element, blockConfig.defaultReply)) === 'quit') {
              return 'quit'
            }
          }
        }
      }

      if ('group_id' in context) {
        const { group_id } = context
        if (element.whiteGroup) {
          if (element.whiteGroup === '*' || element.whiteGroup.includes(group_id)) {
            continue
          } else {
            if ((await check(context, command, element, blockConfig.defaultReply)) === 'quit') {
              return 'quit'
            }
          }
        }

        if (element.blackGroup) {
          if (element.blackGroup === '*' || element.blackGroup.includes(group_id)) {
            if ((await check(context, command, element, blockConfig.defaultReply)) === 'quit') {
              return 'quit'
            }
          }
        }
      }
    }
  }
}

async function check(
  context: SocketHandle['message'],
  command: commandFormat,
  element: blockRule,
  defaultReply: string
) {
  if (command.name.match(element.regexp)) {
    if (element.reply !== '')
      await quickOperation({
        context,
        operation: { reply: element.reply ?? defaultReply }
      })
    if (debug) {
      if ('group_id' in context) {
        logger.DEBUG(`群组 ${context.group_id} 的命令 ${element.regexp} 处于黑名单中`)
      } else if ('user_id' in context) {
        logger.DEBUG(`用户 ${context.user_id} 的命令 ${element.regexp} 处于黑名单中`)
      }
    }
    return 'quit'
  }
}

async function checkRole(context: SocketHandle['message'], command: commandFormat) {
  const { botConfig } = global.config as { botConfig: botConfig }

  const { user_id } = context
  if (user_id !== botConfig.admin) {
    await quickOperation({ context, operation: { reply: '你不是管理员 : }' } })
    return false
  }

  if (await missingParams(context, command, 2)) return false

  return true
}

async function ban(context: SocketHandle['message'], command: commandFormat) {
  let { blockConfig } = global.config as { blockConfig: blockConfig }

  if (!(await checkRole(context, command))) return

  const { params } = command
  const type = params[0]
  const id = params[1]

  if (type === '人') {
    if (blockConfig.blockUsers.includes(parseInt(id)))
      return await quickOperation({ context, operation: { reply: '已存在' } })
    blockConfig.blockUsers.push(parseInt(id))
  } else if (type === '群') {
    if (blockConfig.blockGroups.includes(parseInt(id)))
      return await quickOperation({ context, operation: { reply: '已存在' } })
    blockConfig.blockGroups.push(parseInt(id))
  } else {
    return await quickOperation({ context, operation: { reply: '未知类型' } })
  }

  await await quickOperation({ context, operation: { reply: '已添加' } })
  // 回写
  writeConfig(blockConfig)
}

async function unban(context: SocketHandle['message'], command: commandFormat) {
  let { blockConfig } = global.config as { blockConfig: blockConfig }

  if (!(await checkRole(context, command))) return

  const { params } = command

  const type = params[0]
  const id = params[1]

  if (type === '人') {
    const index = blockConfig.blockUsers.findIndex(v => v === parseInt(id))
    if (index === -1) return await quickOperation({ context, operation: { reply: '不存在' } })
    blockConfig.blockUsers.splice(index, 1)
  } else if (type === '群') {
    const index = blockConfig.blockGroups.findIndex(v => v === parseInt(id))
    if (index === -1) return await quickOperation({ context, operation: { reply: '不存在' } })
    blockConfig.blockGroups.splice(index, 1)
  } else {
    return await quickOperation({ context, operation: { reply: '未知类型' } })
  }

  writeConfig(blockConfig)
}

function writeConfig(blockConfig: blockConfig) {
  fs.writeFileSync(path.join(getDir(import.meta), 'config.jsonc'), jsonc.stringify(blockConfig))
}
