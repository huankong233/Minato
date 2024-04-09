interface redPacketData {
  redPackets: redPacket[]
}

interface redPacket {
  id: number
  send_user_id: number
  redPacket_num: number
  pigeon_num: number
  code: string
  picked_user: string
}
