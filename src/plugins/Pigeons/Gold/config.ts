export interface GoldConfig {
  boardcast: {
    groups: number[]
    users: number[]
  }
  cron: string
}

export const config: GoldConfig = {
  boardcast: {
    groups: [],
    users: [],
  },
  cron: '30 9-16 * * 1-5',
}
