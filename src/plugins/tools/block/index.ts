import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger, type Logger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { MessageHandler, NoticeHandler, RequestHandler, Structs } from 'node-napcat-ts'
import { BlockConfig, config } from './config.ts'
import { type Command } from '@/global.js'

export default class Block {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'block' })
  }

  async init() {
    eventReg({
      pluginName: 'block',
      type: 'command',
      commandName: '*',
      description: '检查封禁状态',
      hide: true,
      callback: (context, command) => this.checkBan(context, command),
      priority: 102
    })

    eventReg({
      pluginName: 'block',
      type: 'notice',
      callback: (context) => this.checkBan(context),
      priority: 102
    })

    eventReg({
      pluginName: 'block',
      type: 'request',
      callback: (context) => this.checkBan(context),
      priority: 102
    })
  }

  async checkBan(
    context: MessageHandler['message'] | NoticeHandler['notice'] | RequestHandler['request'],
    command?: Command
  ) {
    if ((await this._check(config, context)) === 'quit') return 'quit'

    if (!config.commands) return
    if (context.post_type !== 'message') return
    if (!command) return
    const commandName = command.name

    for (const item of config.commands) {
      if (
        (item.name instanceof RegExp && item.name.test(commandName)) ||
        commandName === item.name
      ) {
        if ((await this._check(item as BlockConfig, context)) === 'quit') return 'quit'
      }
    }
  }

  async _check(
    rules: BlockConfig,
    context: MessageHandler['message'] | NoticeHandler['notice'] | RequestHandler['request']
  ) {
    if (rules.allowUsers && 'user_id' in context) {
      if (!rules.allowUsers.includes(context.user_id)) {
        this.#logger.DEBUG(`用户 ${context.user_id} 不处于白名单中`)
        return 'quit'
      }
    }

    if (rules.allowGroups && 'group_id' in context) {
      if (!rules.allowGroups.includes(context.group_id)) {
        this.#logger.DEBUG(`群组 ${context.group_id} 不处于白名单中`)
        return 'quit'
      }
    }

    if (rules.blockUsers && 'user_id' in context) {
      const found = rules.blockUsers.find(
        (value) => (typeof value !== 'number' ? value.user_id : value) === context.user_id
      )

      if (found) {
        this.#logger.DEBUG(`用户 ${context.user_id} 处于黑名单中`)
        if (context.post_type === 'message') {
          const message =
            (typeof found !== 'number' ? found.reply : undefined) ??
            rules.defaultReply ??
            config.defaultReply
          if (message !== '') await sendMsg(context, [Structs.text({ text: message })])
        }
        return 'quit'
      }
    }

    if (rules.blockGroups && 'group_id' in context) {
      const found = rules.blockGroups.find(
        (value) => (typeof value !== 'number' ? value.group_id : value) === context.group_id
      )

      if (found) {
        this.#logger.DEBUG(`群组 ${context.group_id} 处于黑名单中`)
        if (context.post_type === 'message') {
          const message =
            (typeof found !== 'number' ? found.reply : undefined) ??
            rules.defaultReply ??
            config.defaultReply
          if (message !== '') await sendMsg(context, [Structs.text({ text: message })])
        }
        return 'quit'
      }
    }
  }
}
