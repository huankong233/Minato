import axios from '@/libs/axios.ts'
import { humanNum } from '@/libs/humanNum.ts'
import { type Logger } from '@/libs/logger.ts'
import { Structs } from 'node-napcat-ts'
import { USER_AGENT } from './const.ts'

export const getLiveRoomInfo = async (id: string, logger: Logger) => {
  try {
    const response = await axios(
      `https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${id}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': USER_AGENT
        }
      }
    )

    const { code, message, data } = response.data

    if (code !== 0) return [Structs.text({ text: `Error: (${code})${message}` })]

    const {
      room_info: {
        room_id,
        short_id,
        title,
        live_status,
        area_name,
        parent_area_name,
        keyframe,
        online
      },
      anchor_info: {
        base_info: { uname }
      }
    } = data

    return [
      Structs.image({ file: keyframe }),
      Structs.text({
        text: [
          title,
          `主播: ${uname}`,
          `房间号: ${room_id}${short_id ? `  短号: ${short_id}` : ''}`,
          `分区: ${parent_area_name}${parent_area_name === area_name ? '' : `-${area_name}`}`,
          live_status ? `直播中  ${humanNum(online)}人气` : '未开播',
          `https://live.bilibili.com/${short_id || room_id}`
        ].join('\n')
      })
    ]
  } catch (error) {
    logger.ERROR(`B站直播信息获取失败`)
    logger.DIR({ id }, false, false)
    logger.DIR(error, false, false)
    return [Structs.text({ text: '直播信息获取失败~' })]
  }
}
