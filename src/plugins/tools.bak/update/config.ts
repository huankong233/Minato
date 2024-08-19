export interface UpdateConfig {
  //开关
  enable: boolean
  //github代理地址
  proxy: string
  // 参考: https://crontab.guru/
  cron: string
}

export const config: UpdateConfig = {
  enable: true,
  proxy: '',
  cron: '0 8 * * *'
}
