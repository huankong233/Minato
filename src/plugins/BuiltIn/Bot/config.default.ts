import { type NCWebsocketOptions } from 'node-napcat-ts'

export interface BotConfig {
  connect: NCWebsocketOptions
  online: {
    enable: boolean
    msg: string
    to: number
  }
  admin_id: number
  command_prefix: string
}

export const config: BotConfig = {
  connect: {
    protocol: 'ws',
    host: 'localhost',
    port: 3001,
    accessToken: '',
    reconnection: {
      enable: true,
      attempts: 10,
      delay: 5000
    }
  },
  online: {
    enable: true,
    msg: '上线成功~',
    to: 0
  },
  admin_id: 0,
  command_prefix: '/'
}
