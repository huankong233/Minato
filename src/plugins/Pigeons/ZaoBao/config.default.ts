export interface ZaoBaoConfig {
  type: '摸鱼人日历' | '每天60秒'
  crontab: string
  boardcast: boardcastConfig[]
}

export type boardcastConfig = (
  | {
      group_id: number
    }
  | {
      user_id: number
    }
) & { type?: '摸鱼人日历' | '每天60秒'; crontab?: string }

export const config: ZaoBaoConfig = {
  type: '摸鱼人日历',
  // 参考: https://crontab.guru/
  crontab: '30 8 * * *',
  // 需要发送的群组
  boardcast: [],
}
