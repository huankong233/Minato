import axios from '@/libs/axios.ts'
import { humanNum } from '@/libs/humanNum.ts'
import { type Logger } from '@/libs/logger.ts'
import { Structs } from 'node-napcat-ts'
import { USER_AGENT } from './const.ts'

export const getLiveRoomInfo = async (id: string, logger: Logger) => {
  try {
    const [mainResponse, unameResponse] = await Promise.all([
      axios.get(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${id}`, {
        timeout: 10000,
        headers: {
          'User-Agent': USER_AGENT,
        },
      }),
      axios.get(`https://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room?roomid=${id}`, {
        timeout: 10000,
        headers: {
          'User-Agent': USER_AGENT,
        },
      }),
    ])

    const { code, message, data } = mainResponse.data

    if (code !== 0) return [Structs.text(`Error: (${code})${message}`)]

    const { room_id, short_id, title, live_status, area_name, parent_area_name, keyframe, online } = data
    const uname = unameResponse?.data?.data?.info?.uname ?? '不知道叫什么喵'

    return [
      Structs.image(keyframe),
      Structs.text(
        [
          title,
          `主播: ${uname}`,
          `房间号: ${room_id}${short_id ? `  短号: ${short_id}` : ''}`,
          `分区: ${parent_area_name}${parent_area_name === area_name ? '' : `-${area_name}`}`,
          live_status ? `直播中  ${humanNum(online)}人气` : '未开播',
          `https://live.bilibili.com/${short_id || room_id}`,
        ].join('\n'),
      ),
    ]
  } catch (error) {
    logger.ERROR(`B站直播信息获取失败`)
    logger.DIR({ id }, false)
    logger.DIR(error, false)
    return [Structs.text('直播信息获取失败~')]
  }
}
