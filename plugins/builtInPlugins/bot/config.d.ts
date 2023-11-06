import type { LoginInfo } from '@huan_kong/go-cqwebsocket'

export interface botConfig {
  configName: string
  botName: string
  admin: number
  prefix: string
  online: {
    enable: boolean
    msg: string
  }
  connect: {
    host: string
    port: number
    enableAPI: boolean
    enableEvent: boolean
    accessToken: string
    reconnection: boolean
    reconnectionAttempts: number
    reconnectionDelay: number
  }
}

export interface botData {
  wsType: '/api' | '/event'
  ffmpeg: boolean
  info: LoginInfo
}
