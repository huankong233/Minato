export interface GoldConfig {
  broadcast: {
    groups: number[]
    users: number[]
  }
  changeGroupName: number[]
  cron: string
}

export const config: GoldConfig = {
  broadcast: {
    groups: [],
    users: []
  },
  changeGroupName: [],
  cron: '30 14 * * *'
}
