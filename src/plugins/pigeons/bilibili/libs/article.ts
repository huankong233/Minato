import axios from '@/libs/axios.ts'
import { humanNum } from '@/libs/humanNum.ts'
import { type Logger } from '@/libs/logger.ts'
import { Structs } from 'node-napcat-ts'
import { USER_AGENT } from './const.ts'

export const getArticleInfo = async (id: string, logger: Logger) => {
  try {
    const response = await axios(`https://api.bilibili.com/x/article/viewinfo?id=${id}`, {
      timeout: 10000,
      headers: {
        'User-Agent': USER_AGENT
      }
    })

    const { code, message, data } = response.data

    if (code !== 0) return [Structs.text({ text: `Error: (${code})${message}` })]

    const {
      stats: { view, reply },
      title,
      author_name,
      origin_image_urls: [img]
    } = data

    return [
      Structs.image({ file: img }),
      Structs.text({
        text: [
          title,
          `UP: ${author_name}`,
          `${humanNum(view)}阅读 ${humanNum(reply)}评论`,
          `https://www.bilibili.com/read/cv${id}`
        ].join('\n')
      })
    ]
  } catch (error) {
    logger.ERROR(`B站文章信息获取失败`)
    logger.DIR({ id }, false, false)
    logger.DIR(error, false, false)
    return [Structs.text({ text: '文章信息获取失败~' })]
  }
}
