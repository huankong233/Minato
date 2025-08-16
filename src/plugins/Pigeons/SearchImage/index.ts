import type { allEvents, Command } from '@/global.js'
import { downloadFile, getFileBase64 } from '@/libs/fs.ts'
import { confuseURL, getUniversalImgURL } from '@/libs/handleUrl.ts'
import { sendForwardMsg, sendMsg } from '@/libs/sendMsg.ts'
import { formatTime } from '@/libs/time.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import PigeonTool from '@/plugins/Pigeons/PigeonTool/index.ts'
import { AnimeTrace, ascii2d, IqDB, SauceNAO, TraceMoe, type AnimeTraceReq, type ascii2dReq, type IqDBReq, type SauceNAOReq, type TraceMoeReq } from 'image_searcher'
import { Structs, type AllHandlers, type NodeSegment, type SendMessageSegment } from 'node-napcat-ts'
import { config } from './config.ts'

export default class SearchImage extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '空空搜图',
      description: '空空搜图',
      callback: this.search.bind(this),
    },
    {
      type: 'message',
      callback: this.message.bind(this),
      priority: 999,
    },
  ]

  users: { [key: number]: { surplus_time: number; context: AllHandlers['message'] } } = {}

  async init() {
    setInterval(async () => {
      if (Object.keys(this.users).length === 0) return
      for (const key in this.users) {
        const user = this.users[key]
        if (user.surplus_time <= 0) {
          await sendMsg(user.context, [Structs.text(`已自动退出搜图模式~\n下次记得说 退出 来退出搜图模式哦~`)])
          delete this.users[key]
        } else {
          this.users[key].surplus_time--
        }
      }
    }, 1000)
  }

  async search(context: AllHandlers['message'], _command: Command) {
    this.users[context.user_id] = {
      surplus_time: config.autoLeave,
      context,
    }
    await sendMsg(context, [Structs.text(config.word.on_reply)])
  }

  async message(context: AllHandlers['message']) {
    const user = this.users[context.user_id]
    if (!user) return
    // 已在搜图模式
    const firstMessage = context.message[0]
    if (firstMessage.type === 'text' && firstMessage.data.text === '退出') {
      delete this.users[context.user_id]
      return 'quit'
    }

    // 开始处理图片
    const images = context.message.filter((item) => item.type === 'image')
    if (images.length === 0) return 'quit'

    let isSaidReceived = false
    for (const image of images) {
      // 先扣鸽子
      const isEnough = PigeonTool.reduce(context, config.reduce, '搜图')
      if (!isEnough) {
        await sendMsg(context, [Structs.text('鸽子不够了哦~')])
        return 'quit'
      }

      if (!isSaidReceived) {
        await sendMsg(context, [Structs.text(config.word.receive)])
        isSaidReceived = true
      }

      // 刷新搜图时间
      this.users[context.user_id].surplus_time = config.autoLeave

      await this.imageHandler(context, image.data.url)
    }

    return 'quit'
  }

  async imageHandler(context: AllHandlers['message'], url: string) {
    //图片url
    const imageUrl = getUniversalImgURL(url)
    const imagePath = await downloadFile(imageUrl)

    // 获取数据
    const response = await this.getData(imagePath)

    // 整理数据
    const messages = await this.parseData(context, response)

    messages.unshift(Structs.customNode([Structs.image(url)]))

    await sendForwardMsg(context, messages)
  }

  async getData(imagePath: string) {
    const requestParams = [
      {
        name: 'ascii2d',
        callback: ascii2d,
        params: {
          type: 'color',
          proxy: config.ascii2dProxy,
          imagePath,
        } as ascii2dReq,
      },
      {
        name: 'SauceNAO',
        callback: SauceNAO,
        params: {
          hide: false,
          imagePath,
        } as SauceNAOReq,
      },
      {
        name: 'IqDB',
        callback: IqDB,
        params: {
          discolor: true,
          services: ['danbooru', 'konachan', 'yandere', 'gelbooru', 'sankaku_channel', 'e_shuushuu', 'zerochan', 'anime_pictures'],
          imagePath,
        } as IqDBReq,
      },
      {
        name: 'TraceMoe',
        callback: TraceMoe,
        params: {
          cutBorders: true,
          imagePath,
        } as TraceMoeReq,
      },
      {
        name: 'AnimeTraceAnime',
        callback: AnimeTrace,
        params: {
          model: 'anime_model_lovelive',
          force_one: 1,
          preview: true,
          imagePath,
        } as AnimeTraceReq,
      },
      {
        name: 'AnimeTraceGame',
        callback: AnimeTrace,
        params: {
          model: 'game_model_kirakira',
          force_one: 1,
          preview: true,
          imagePath,
        } as AnimeTraceReq,
      },
    ]

    // 每次只能发一个请求
    const response: ({ success: true; name: string; response: any; cost: number } | { success: false; name: string })[] = []

    for (const requestParam of requestParams) {
      try {
        const start = performance.now()
        response.push({
          success: true,
          name: requestParam.name,
          response: await requestParam.callback(requestParam.params as any),
          cost: performance.now() - start,
        })
      } catch (error) {
        this.logger.ERROR(`${requestParam.name}请求失败`)
        this.logger.DIR(error, false)
        response.push({
          success: false,
          name: requestParam.name,
        })
      }
    }

    return response
  }

  async parseData(context: AllHandlers['message'], response: ({ success: true; name: string; response: any; cost: number } | { success: false; name: string })[]) {
    // 总节点
    const messages: NodeSegment[] = []

    for (const apiResponse of response) {
      // 自定义节点内容节点
      const message: SendMessageSegment[] = []

      if (!apiResponse.success) {
        await PigeonTool.add(context, config.back, `${apiResponse.name}搜图失败力`)
        message.push(Structs.text(`${apiResponse.name}搜图失败力~已赔偿鸽子${config.back}只`))
        messages.push(Structs.customNode(message))
        continue
      }

      const { response, cost } = apiResponse

      message.push(Structs.text(`[${apiResponse.name}] (耗时: ${parseInt(cost.toString())}ms):\n`))
      if (response.length === 0) {
        message.push(Structs.text('没有搜图结果哦~'))
        messages.push(Structs.customNode(message))
        continue
      }

      // 截取搜索结果
      const results = apiResponse.response.slice(0, config.limit)

      for (const index in results) {
        const item = results[index]
        if (apiResponse.name === 'ascii2d') {
          message.push(
            item.image && item.image !== '' ? Structs.image(`base64://${await getFileBase64(item.image)}`) : Structs.text('无图片~'),
            Structs.text(
              [
                `图片信息:${item.info}`,
                `链接: ${confuseURL(item.source?.link ?? '未知', true)}(${item.source?.text ?? '未知'})`,
                `作者: ${item.author?.text ?? '未知'}(${confuseURL(item.author?.link ?? '未知', true)})`,
                ``,
                ``,
              ].join('\n'),
            ),
          )
        } else if (apiResponse.name === 'SauceNAO') {
          message.push(
            item.image !== 'https://saucenao.com/' || item.image !== '' ? Structs.image(`base64://${await getFileBase64(item.image)}`) : Structs.text('无图片~'),
            Structs.text([`标题: ${item.title}`, `相似度: ${item.similarity}`, `图片信息:`, ...this.joinContent(item.content), ``, ``].join('\n')),
          )
        } else if (apiResponse.name === 'IqDB') {
          message.push(
            item.image && item.image !== '' ? Structs.image(`base64://${await getFileBase64(item.image)}`) : Structs.text('无图片~'),
            Structs.text([`分辨率: ${item.resolution}`, `相似度: ${item.similarity}`, `链接: ${confuseURL(item.url, true)}`, ``, ``].join('\n')),
          )
        } else if (apiResponse.name === 'TraceMoe') {
          message.push(
            item.image && item.image !== '' ? Structs.image(`base64://${await getFileBase64(item.image)}`) : Structs.text('无图片~'),
            Structs.text(
              [
                `预览视频: ${item.video ?? '无'}`,
                `相似度: ${parseInt(item.similarity)}`,
                `文件名: ${item.filename}`,
                `集数: ${item.episode}`,
                `大概位置: ${formatTime(item.from)}——${formatTime(item.to)}`,
                ``,
                ``,
              ].join('\n'),
            ),
          )
        } else if (apiResponse.name === 'AnimeTraceAll' || apiResponse.name === 'AnimeTraceAnime' || apiResponse.name === 'AnimeTraceGame') {
          message.push(
            item.preview !== 'failed unsupported image type' && item.preview ? Structs.image(`base64://${item.preview}`) : Structs.text('不支持处理的图片格式'),
            Structs.text(
              item.char
                .slice(0, config.limit2)
                .flatMap((char: any) => [`角色名: ${char.name}`, `动漫名: ${char.cartoonname}`, ``])
                .join('\n'),
            ),
          )
        }
      }

      messages.push(Structs.customNode(message))
    }

    return messages
  }

  joinContent(data: { text: string; link: string }[]) {
    // 初始化一个空数组
    const result = []
    // 初始化一个临时字符串
    let temp = ''
    // 遍历数组中的每个对象
    for (const item of data) {
      // 如果对象有link属性，就用括号包裹link属性，并和text属性拼接成一个字符串，然后添加到临时字符串中
      if (item.link) {
        temp += `${item.text}(${item.link})`
      } else {
        // 否则，如果临时字符串不为空，就把它添加到结果数组中，并清空临时字符串
        if (temp) {
          result.push(temp)
          temp = ''
        }
        // 然后把text属性添加到临时字符串中
        temp += item.text
      }
    }
    // 如果临时字符串不为空，就把它添加到结果数组中
    if (temp) result.push(temp)
    // 返回结果数组
    return result
  }
}
