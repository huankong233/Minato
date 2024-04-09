interface logConfig {
  enable: boolean
  max: number
  level: 'SUCCESS' | 'WARNING' | 'NOTICE' | 'INFO' | 'DEBUG'
  force: boolean
}
