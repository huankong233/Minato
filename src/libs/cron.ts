import _cron from 'node-cron'

export const cron = (cron: string, func: () => void) =>
  _cron.schedule(cron, () => func, { timezone: process.env.TZ })
