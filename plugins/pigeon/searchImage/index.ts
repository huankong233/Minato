import type { CQEvent } from '@huan_kong/go-cqwebsocket'
import type { botConfig, botData } from '@/plugins/builtInPlugins/bot/config.d.ts'
import type {
  searchImageConfig,
  searchImageCallback,
  searchImageResult,
  searchImageSuccessResult,
  searchImageFailResult
} from './config.d.ts'
import { eventReg } from '@/libs/eventReg.ts'
import { add, reduce } from '@/plugins/pigeon/pigeon/index.ts'
import { replyMsg, sendForwardMsg } from '@/libs/sendMsg.ts'
import { getUniversalImgURL } from '@/libs/handleUrl.ts'
import { downloadFile } from '@/libs/fs.ts'
import { ascii2d, SauceNAO, IqDB, TraceMoe, AnimeTrace } from 'image_searcher'
import {
  searchInitialization,
  turnOnSearchMode,
  turnOffSearchMode,
  isSearchMode,
  refreshTimeOfAutoLeave
} from './control.ts'
import { Parser } from './parse.ts'
import { makeLogger } from '@/libs/logger.ts'
import { CQ } from '@huan_kong/go-cqwebsocket'
import fs from 'fs'

export const logger = makeLogger({ pluginName: 'searchImage' })

export default () => {
  //初始化搜图
  searchInitialization()
  //注册事件
  event()
}

function event() {
  const { botConfig, searchImageConfig } = global.config as {
    botConfig: botConfig
    searchImageConfig: searchImageConfig
  }

  eventReg('message', async ({ context }, command) => {
    if (!command) return

    if (command.name === `${botConfig.botName}${searchImageConfig.word.on}`) {
      await turnOnSearchMode(context)
    }
  })

  eventReg(
    'message',
    async ({ context }, command) => {
      if (isSearchMode(context.user_id)) {
        if (command && command.name === `${searchImageConfig.word.off}${botConfig.botName}`) {
          // 退出搜图模式
          return await turnOffSearchMode(context)
        }

        await search(context)
        return 'quit'
      }
    },
    100
  )
}

async function search(context: CQEvent<'message'>['context']) {
  const { user_id } = context
  const { searchImageConfig } = global.config as { searchImageConfig: searchImageConfig }

  //先下载文件
  let messageArray = CQ.parse(context.message)

  let receive = false

  for (let i = 0; i < messageArray.length; i++) {
    const message = messageArray[i]
    if (message._type === 'image') {
      //扣除鸽子
      if (!(await reduce(user_id, searchImageConfig.reduce, '搜图'))) {
        return await replyMsg(context, `搜索失败,鸽子不足~`, { reply: true })
      }

      if (!receive) {
        receive = true
        await replyMsg(context, `${searchImageConfig.word.receive}`, { reply: true })
      }

      //刷新时间
      refreshTimeOfAutoLeave(context.user_id)

      await imageHandler(context, message._data.url)
    }
  }
}

async function imageHandler(context: CQEvent<'message'>['context'], url: string) {
  const { searchImageConfig } = global.config as { searchImageConfig: searchImageConfig }

  //图片url
  const imageUrl = getUniversalImgURL(url)
  const imagePath = await downloadFile(imageUrl)

  const requestParams: searchImageCallback[] = [
    {
      name: 'ascii2d',
      callback: ascii2d,
      params: {
        type: 'bovw',
        proxy: searchImageConfig.ascii2dProxy,
        imagePath
      }
    },
    {
      name: 'SauceNAO',
      callback: SauceNAO,
      params: {
        hide: false,
        imagePath
      }
    },
    {
      name: 'IqDB',
      callback: IqDB,
      params: {
        discolor: false,
        services: [
          'danbooru',
          'konachan',
          'yandere',
          'gelbooru',
          'sankaku_channel',
          'e_shuushuu',
          'zerochan',
          'anime_pictures'
        ],
        imagePath
      }
    },
    {
      name: 'TraceMoe',
      callback: TraceMoe,
      params: {
        cutBorders: true,
        imagePath
      }
    },
    {
      name: 'AnimeTraceAnime',
      callback: AnimeTrace,
      params: {
        model: 'anime_model_lovelive',
        mode: 0,
        preview: true,
        imagePath
      }
    },
    {
      name: 'AnimeTraceGame',
      callback: AnimeTrace,
      params: {
        model: 'game_model_kirakira',
        mode: 0,
        preview: true,
        imagePath
      }
    }
  ]

  const responseData = await request(requestParams)

  await parse(context, responseData, imageUrl)

  //删除文件
  fs.unlinkSync(imagePath)
}

//运行函数防止崩溃
async function request(callbacks: searchImageCallback[]): Promise<searchImageResult[]> {
  let promises = []
  let AnimeTraceGame = null

  for (let i = 0; i < callbacks.length; i++) {
    const item = callbacks[i]
    if (item.name === 'AnimeTraceGame') {
      AnimeTraceGame = item
      continue
    }

    promises.push(
      (async () => {
        try {
          if (debug) logger.DEBUG(`[搜图] 引擎:${item.name}搜索中`)
          const start = performance.now()
          let obj = {
            success: true,
            name: item.name,
            res: await item.callback(item.params),
            cost: 0
          }
          const end = performance.now()
          obj.cost = end - start
          if (debug) logger.DEBUG(`[搜图] 引擎:${item.name}搜索完成`)
          return obj as searchImageSuccessResult
        } catch (error) {
          logger.WARNING(`[搜图] 引擎:${item.name}搜索失败`)
          logger.ERROR(error)
          return { success: false, name: item.name } as searchImageFailResult
        }
      })()
    )
  }

  const response = await Promise.all(promises)

  // 请求AnimeTraceGame
  if (AnimeTraceGame) {
    try {
      if (debug) logger.DEBUG(`[搜图] 引擎:${AnimeTraceGame.name}搜索中`)
      const start = performance.now()
      let obj = {
        success: true,
        name: AnimeTraceGame.name,
        res: await AnimeTraceGame.callback(AnimeTraceGame.params),
        cost: 0
      }
      const end = performance.now()
      obj.cost = end - start
      if (debug) logger.DEBUG(`[搜图] 引擎:${AnimeTraceGame.name}搜索完成`)
      response.push(obj as searchImageSuccessResult)
    } catch (error) {
      logger.WARNING(`[搜图] 引擎:${AnimeTraceGame.name}搜索失败`)
      logger.ERROR(error)
      response.push({ success: false, name: AnimeTraceGame.name } as searchImageFailResult)
    }
  }

  return response
}

//整理数据
async function parse(
  context: CQEvent<'message'>['context'],
  res: searchImageResult[],
  originUrl: string
) {
  const { user_id } = context
  const { searchImageConfig } = global.config as { searchImageConfig: searchImageConfig }
  const { botData } = global.data as { botData: botData }

  let promises = []

  for (let i = 0; i < res.length; i++) {
    promises.push(
      (async () => {
        const datum = res[i]
        if (debug) logger.DEBUG(`[搜图] 引擎:${datum.name}数据处理中`)
        if (!datum.success) {
          //赔偿
          await add(user_id, searchImageConfig.back, `${datum.name}搜图失败赔偿`)
          return CQ.node(
            botData.info.nickname,
            botData.info.user_id,
            `${datum.name}搜图失败力~已赔偿鸽子${searchImageConfig.back}只`
          )
        }

        let message = `${datum.name}(耗时:${Math.floor(datum.cost)}ms):\n`
        if (datum.res.length === 0) {
          message += '没有搜索结果~'
        } else {
          let limit =
            datum.res.length >= searchImageConfig.limit ? searchImageConfig.limit : datum.res.length

          for (let i = 0; i < limit; i++) {
            const item = datum.res[i]
            message += await Parser[datum.name](item)
          }
        }

        if (debug) logger.DEBUG(`[搜图] 引擎:${datum.name}数据处理完成`)

        const node = CQ.node(botData.info.nickname, botData.info.user_id, message)
        return node
      })()
    )
  }

  const messages = [
    CQ.node(botData.info.nickname, botData.info.user_id, CQ.image(originUrl).toString()),
    ...(await Promise.all(promises))
  ]

  //发送
  await sendForwardMsg(context, messages).catch(async () => {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~(鸽子已返还)')
    await add(user_id, searchImageConfig.reduce, `搜图合并消息发送失败赔偿`)
  })
}
