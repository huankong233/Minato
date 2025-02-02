export interface SeTuConfig {
  reg: RegExp
  cd: number
  limit: number
  withdraw: number
  pigeon: number
  antiShieldingMode: 1 | 2 | 3 | 4
  proxy: { enable: boolean; url: string }
  short: { enable: boolean; url: string }
}

export const config: SeTuConfig = {
  //色图的正则
  reg: /^空空.*[来來发發给給][张張个個幅点點份着长]?(?<r18>[Rr]18的?)?(?<tag>.*?)?的?[色瑟][图圖]/,
  //冷却时间单位秒
  cd: 20,
  //每天限制看多少张
  limit: 20,
  //自动撤回(不建议过小)单位秒
  withdraw: 60,
  //每张色图消耗鸽子
  pigeon: 20,
  //反和谐模式
  //1:随机添加色点
  //2:旋转图片
  //3.同时操作
  //4.多次操作
  antiShieldingMode: 3,
  // pixiv代理服务器(如果开启了proxy插件则不会生效!!!)
  // 推荐自己搭地址: pixiv.re
  proxy: { enable: false, url: 'i.pixiv.re' },
  //短链(服务仓库:https://github.com/huankong233/easyShortUrl)
  short: { enable: false, url: '' },
}
