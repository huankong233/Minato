export interface UpdateConfig {
  //开关
  enable: boolean
  //github代理地址
  proxy: string
  // 参考: https://crontab.guru/
  cron: string
  packageJsonUrl: string
}

export const config: UpdateConfig = {
  enable: true,
  proxy: '',
  cron: '0 8 * * *',
  packageJsonUrl: 'https://raw.githubusercontent.com/huankong233/kkbot-ts/master/package.json',
}
