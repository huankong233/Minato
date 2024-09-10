import { type allEvents, type Command } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { type AllHandlers, Structs } from 'node-napcat-ts'
import { type BlockConfig, config } from './config.ts'

export default class Block extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '*',
      description: '检查封禁状态',
      hide: true,
      callback: this.checkBan.bind(this),
      priority: 999
    },
    {
      type: 'message',
      callback: this.checkBan.bind(this),
      priority: 999
    },
    {
      type: 'notice',
      callback: this.checkBan.bind(this),
      priority: 999
    },
    {
      type: 'request',
      callback: this.checkBan.bind(this),
      priority: 999
    }
  ]

  async checkBan(
    context: AllHandlers['message'] | AllHandlers['notice'] | AllHandlers['request'],
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
    context: AllHandlers['message'] | AllHandlers['notice'] | AllHandlers['request']
  ) {
    if (rules.allowUsers && 'user_id' in context) {
      if (!rules.allowUsers.includes(context.user_id)) {
        this.logger.DEBUG(`用户 ${context.user_id} 不处于白名单中`)
        return 'quit'
      }
    }

    if (rules.allowGroups && 'group_id' in context) {
      if (!rules.allowGroups.includes(context.group_id)) {
        this.logger.DEBUG(`群组 ${context.group_id} 不处于白名单中`)
        return 'quit'
      }
    }

    if (rules.blockUsers && 'user_id' in context) {
      const found = rules.blockUsers.find(
        (value) => (typeof value !== 'number' ? value.user_id : value) === context.user_id
      )

      if (found) {
        this.logger.DEBUG(`用户 ${context.user_id} 处于黑名单中`)
        if (context.post_type === 'message') {
          const message =
            (typeof found !== 'number' ? found.reply : undefined) ??
            rules.defaultReply ??
            config.defaultReply
          if (message !== '') await sendMsg(context, [Structs.text(message)])
        }
        return 'quit'
      }
    }

    if (rules.blockGroups && 'group_id' in context) {
      const found = rules.blockGroups.find(
        (value) => (typeof value !== 'number' ? value.group_id : value) === context.group_id
      )

      if (found) {
        this.logger.DEBUG(`群组 ${context.group_id} 处于黑名单中`)
        if (context.post_type === 'message') {
          const message =
            (typeof found !== 'number' ? found.reply : undefined) ??
            rules.defaultReply ??
            config.defaultReply
          if (message !== '') await sendMsg(context, [Structs.text(message)])
        }
        return 'quit'
      }
    }
  }
}
