export interface LogConfig {
  // 最大数
  max: number
  // 强制开启记录日志
  force: boolean
}

export const config: LogConfig = {
  max: 100,
  force: false
}
