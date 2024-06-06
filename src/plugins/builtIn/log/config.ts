export interface LogConfig {
  max: number
  force: boolean
}

export const config: LogConfig = {
  // 最大数
  max: 100,
  // 强制开启记录日志
  force: false
}
