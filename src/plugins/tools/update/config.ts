export interface UpdateConfig {
  enable: boolean
  proxy: string
  cron: string
}

export const config: UpdateConfig = {
  //开关
  enable: true,
  //github代理地址
  proxy: '',
  // 参考: https://crontab.guru/
  cron: '0 8 * * *'
}
