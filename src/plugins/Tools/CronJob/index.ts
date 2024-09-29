import { cron } from '@/libs/cron.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { config } from './config.ts'

export const enable = config.crons.length > 0

export default class CronJob extends BasePlugin {
  init = () => {
    config.crons.forEach((config) => {
      cron(config.crontab, async () => {
        try {
          await bot.send(config.action, config.params)
        } catch (error) {
          this.logger.ERROR('定时任务遇到错误')
          this.logger.DIR(error, false)
        }
      })
    })
  }
}
