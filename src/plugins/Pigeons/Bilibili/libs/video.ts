import axios from '@/libs/axios.ts'
import { humanNum } from '@/libs/humanNum.ts'
import { type Logger } from '@/libs/logger.ts'
import { Structs } from 'node-napcat-ts'
import { USER_AGENT } from './const.ts'
import { getVideoJumpTimeStr } from './utils.ts'

export const getVideoInfo = async (params: { aid?: string; bvid?: string; videoJump?: number }, logger: Logger) => {
  try {
    const response = await axios.get(`https://api.bilibili.com/x/web-interface/view`, {
      params,
      timeout: 10000,
      headers: {
        'User-Agent': USER_AGENT,
      },
    })

    const { code, message, data } = response.data

    if (code === -404) return [Structs.text('该视频已被删除')]
    if (code !== 0) return [Structs.text(`Error: (${code})${message}`)]

    const {
      bvid,
      aid,
      pic,
      title,
      owner: { name },
      stat: { view, danmaku },
    } = data

    const { videoJump } = params
    const videoJumpText = videoJump ? `精准空降(${getVideoJumpTimeStr(videoJump)}): https://www.bilibili.com/video/${bvid}?t=${videoJump}` : null

    return [
      Structs.image(pic),
      Structs.text([`av${aid}`, title, `UP: ${name}`, `${humanNum(view)}播放 ${humanNum(danmaku)}弹幕`, videoJumpText ?? `https://www.bilibili.com/video/${bvid}`].join('\n')),
    ]
  } catch (error) {
    logger.ERROR(`B站视频信息获取失败`)
    logger.DIR(params, false)
    logger.DIR(error, false)
    return [Structs.text('视频信息获取失败~')]
  }
}
