import { CronJob } from 'cron'

export const cron = (cron: string, func: () => void) =>
  new CronJob(
    cron, // cronTime
    func, // onTick
    null, // onComplete
    true, // start
    process.env.TZ ?? 'Asia/Shanghai' // timeZone
  )
