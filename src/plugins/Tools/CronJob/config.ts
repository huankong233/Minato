import type { WSSendParam } from 'node-napcat-ts'

export interface CronJobBase<T extends keyof WSSendParam> {
  crontab: string
  action: T
  params: WSSendParam[T]
}

export type CronJobConfig = {
  crons: {
    [K in keyof WSSendParam]: CronJobBase<K>
  }[keyof WSSendParam][]
}

export const config: CronJobConfig = {
  crons: []
}
