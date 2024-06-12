import { version as local_version } from '@/../package.json'
import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger, type Logger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { config as botConfig } from '@/plugins/builtIn/bot/config.ts'
import axios from 'axios'
import { compare } from 'compare-versions'
import cron from 'node-cron'
import { MessageHandler } from 'node-napcat-ts'
import { config } from './config.ts'

export const enable = config.enable

const packageJsonUrl = 'https://raw.githubusercontent.com/huankong233/kkbot-ts/master/package.json'

export default class Update {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'update' })
  }

  async init() {
    eventReg({
      type: 'command',
      pluginName: 'update',
      callback: (context, _) => this.message(context),
      name: '检查更新'
    })

    cron.schedule(config.cron, () => this.checkUpdate())
  }

  async message(context: MessageHandler['message']) {
    this.checkUpdate(context)
  }

  async checkUpdate(context?: MessageHandler['message']) {
    let message = ['检查更新失败', `当前版本: ${local_version}`, `请检查您的网络状况！`].join('\n')

    let remote_version = ''
    try {
      remote_version = await axios(packageJsonUrl).then((res) => res.data.version)
    } catch (error) {
      this.#logger.ERROR('获取最新版本号失败')
      this.#logger.DEBUG(error)
      await sendMsg(context ?? { message_type: 'private', user_id: botConfig.admin_id }, message)
      return
    }

    if (compare(local_version, remote_version, '>=')) {
      if (context) {
        message = [
          'kkbot无需更新哟~',
          `最新版本: ${remote_version}`,
          `当前版本: ${local_version}`
        ].join('\n')
        await sendMsg(context ?? { message_type: 'private', user_id: botConfig.admin_id }, message)
      }
    } else {
      //需要更新，通知admin
      message = [
        'kkbot有更新哟~',
        `最新版本: ${remote_version}`,
        `当前版本: ${local_version}`
      ].join('\n')
      await sendMsg(context ?? { message_type: 'private', user_id: botConfig.admin_id }, message)
    }
  }
}
