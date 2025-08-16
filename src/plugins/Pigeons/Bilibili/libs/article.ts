import axios from '@/libs/axios.ts'
import { humanNum } from '@/libs/humanNum.ts'
import { type Logger } from '@/libs/logger.ts'
import { Structs } from 'node-napcat-ts'
import { FAKE_COOKIE, USER_AGENT } from './const.ts'

export const getArticleInfo = async (id: string, logger: Logger) => {
  try {
    const response = await axios.get(`https://api.bilibili.com/x/article/viewinfo?id=${id}`, {
      timeout: 10000,
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: FAKE_COOKIE,
      },
    })

    const { code, message, data } = response.data

    if (code !== 0) return [Structs.text(`Error: (${code})${message}`)]

    const {
      stats: { view, reply },
      title,
      author_name,
      origin_image_urls: [img],
    } = data

    return [Structs.image(img), Structs.text([title, `UP: ${author_name}`, `${humanNum(view)}阅读 ${humanNum(reply)}评论`, `https://www.bilibili.com/read/cv${id}`].join('\n'))]
  } catch (error) {
    logger.ERROR(`B站文章信息获取失败`)
    logger.DIR({ id }, false)
    logger.DIR(error, false)
    return [Structs.text('文章信息获取失败~')]
  }
}
