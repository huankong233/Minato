export interface GoldConfig {
  boardcast: {
    groups: number[]
    users: number[]
  }
  changeGroupName: number[]
  cron: string
}

export const config: GoldConfig = {
  boardcast: {
    groups: [],
    users: []
  },
  changeGroupName: [],
  cron: '30 14 * * *'
}
