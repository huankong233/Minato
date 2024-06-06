import { type NCWebsocketOptions } from 'node-napcat-ts'

export interface BotConfig {
  connect: NCWebsocketOptions
  reconnection: {
    enable: boolean
    attempts: number
    delay: number
  }
  online: {
    enable: boolean
    msg: string
    to: number
  }
  self_id: number
}

export const config: BotConfig = {
  connect: {
    protocol: 'ws',
    host: 'localhost',
    port: 3001,
    accessToken: ''
  },
  reconnection: {
    enable: true,
    attempts: 10,
    delay: 5000
  },
  online: {
    enable: true,
    msg: '上线成功~',
    to: 0
  },
  self_id: 0
}
