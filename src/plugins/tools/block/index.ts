import { Command } from '@/global.ts'
import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger, type Logger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { MessageHandler, NoticeHandler, RequestHandler } from 'node-napcat-ts'
import { BlockConfig, config } from './config.ts'

export default class Block {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'block' })
  }

  async init() {
    eventReg({
      pluginName: 'block',
      type: 'message',
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
    command?: Command | false
  ) {
    if ((await this._check(config, context)) === 'quit') return 'quit'

    if (!command) return

    if (config.commands && context.post_type === 'message') {
      for (let i = 0; i < config.commands.length; i++) {
        const nowCommand = config.commands[i]

        if (
          (nowCommand.name instanceof RegExp && nowCommand.name.test(context.message)) ||
          command.name === nowCommand.name
        ) {
          if ((await this._check(nowCommand, context)) === 'quit') return 'quit'
        }
      }
    }
  }

  async _check(
    rules: BlockConfig | NonNullable<BlockConfig['commands']>[number],
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
            (typeof found !== 'number' ? found.reply : undefined) ?? config.defaultReply
          if (message !== '') await sendMsg(context, message)
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
            (typeof found !== 'number' ? found.reply : undefined) ?? config.defaultReply
          if (message !== '') await sendMsg(context, message)
        }
        return 'quit'
      }
    }
  }
}
