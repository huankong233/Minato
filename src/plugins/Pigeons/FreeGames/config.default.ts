export interface FreeGamesConfig {
  crontab: string
  groups: number[]
  cd: number
}

export const config: FreeGamesConfig = {
  crontab: '0 0 8 * * *',
  groups: [],
  cd: 10,
}
