import { CronJob } from 'cron'

export const cron = (cron: string, func: () => void, onComplete = null, start = true) =>
  new CronJob(
    cron, // cronTime
    func, // onTick
    onComplete, // onComplete
    start, // start
    process.env.TZ ?? 'Asia/Shanghai' // timeZone
  )
