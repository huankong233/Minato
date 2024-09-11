import type { RedPacket } from '@/global.js'
import type { Receive } from 'node-napcat-ts'

export type redPackets = RedPacket & {
  code: (Receive['image'] | Receive['text'] | Receive['face'])[]
  picked_user: number[]
}
