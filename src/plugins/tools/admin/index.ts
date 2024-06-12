import { Command } from '@/global.ts'
import { getUserName } from '@/libs/api.ts'
import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger, type Logger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { config as botConfig } from '@/plugins/builtIn/bot/config.ts'
import { MessageHandler, NoticeHandler, RequestHandler } from 'node-napcat-ts'
import { config } from './config.ts'

export default class Admin {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'admin' })
  }

  async init() {
    eventReg({
      type: 'command',
      pluginName: 'admin',
      callback: (context, command) => this.message(command, context),
      name: ['friend', 'add', 'invite'],
      params: [{ type: 'enum', enum: ['接受', '拒绝'] }, { type: 'string' }],
      priority: 102
    })

    eventReg({
      pluginName: 'admin',
      type: 'notice',
      callback: (context) => this.notice(context),
      priority: 102
    })

    eventReg({
      pluginName: 'admin',
      type: 'request',
      callback: (context) => this.request(context),
      priority: 102
    })
  }

  async sendNotice(context: RequestHandler['request'], auto: boolean) {
    const { request_type, flag, user_id, comment } = context

    const sub_type: 'friend' | 'add' | 'invite' =
      request_type === 'group' ? context.sub_type : request_type

    await sendMsg(
      { message_type: 'private', user_id: botConfig.admin_id },
      [
        `用户 : ${getUserName(user_id)}(${user_id})`,
        request_type === 'group' ? `申请${context.sub_type} : ${context.group_id}` : '',
        `验证信息 : ${comment}`,
        auto
          ? '已自动同意了哦~'
          : [
              `接受回复 : ${sub_type} 接受 ${flag}`,
              `拒绝回复 : ${sub_type} 拒绝 ${flag} ${
                request_type === 'friend' ? '拒绝理由(可选)' : ''
              }`
            ].join('\n')
      ].join('\n')
    )
  }

  async notice(context: NoticeHandler['notice']) {
    const { notice_type } = context

    if (notice_type === 'group_increase' || notice_type === 'group_decrease') {
      const { user_id, group_id } = context

      await sendMsg(
        { message_type: 'group', group_id },
        notice_type === 'group_increase'
          ? `${await getUserName(user_id)} 欢迎加群呀~ ヾ(≧▽≦*)o`
          : `${await getUserName(user_id)} 退群了 (*>.<*)`
      )
    }
  }

  async request(context: RequestHandler['request']) {
    const { request_type } = context

    if (request_type === 'group') {
      const { sub_type } = context
      if (sub_type === 'add') {
        //申请加群
        if (config.add.message) await this.sendNotice(context, config.add.agree)
        if (config.add.agree) {
          await this.message({ name: 'add', args: ['接受', context.flag] })
        }
      } else if (sub_type === 'invite') {
        //邀请机器人入群
        if (config.invite.message) await this.sendNotice(context, config.invite.agree)
        if (config.invite.agree) {
          await this.message({ name: 'invite', args: ['接受', context.flag] })
        }
      }
    } else if (request_type === 'friend') {
      //添加好友
      if (config.friend.message) await this.sendNotice(context, config.friend.agree)
      if (config.friend.agree) {
        await this.message({ name: 'friend', args: ['接受', context.flag] })
      }
    }
  }

  async message(command: Command, context?: MessageHandler['message']) {
    try {
      if (command.name === 'friend') {
        await bot.set_friend_add_request({
          approve: command.args[0] === '接受',
          flag: command.args[1]
        })
      } else if (command.name === 'add') {
        await bot.set_group_add_request({
          approve: command.args[0] === '接受',
          flag: command.args[1]
        })
      } else if (command.name === 'invite') {
        await bot.set_group_add_request({
          approve: command.args[0] === '接受',
          flag: command.args[1]
        })
      }
    } catch (error) {
      this.#logger.DEBUG('操作失败', error)
      await sendMsg(context ?? { message_type: 'private', user_id: botConfig.admin_id }, '操作失败')
    }
  }
}
