/**
 * 代码来自 : https://github.com/Tsuk1ko/cq-picsearcher-bot
 */

import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger, type Logger } from '@/libs/logger.ts'
import type { AllHandlers } from 'node-napcat-ts'
import { config } from './config.ts'
// import { getArticleInfo } from './libs/article.ts'
// import { getDynamicInfo } from './libs/dynamic.ts'
// import { getLiveRoomInfo } from './libs/live.ts'
// import { getVideoInfo } from './libs/video.ts'

export const enable =
  config.despise ||
  config.recallMiniProgram ||
  config.getInfo.getVideoInfo ||
  config.getInfo.getDynamicInfo ||
  config.getInfo.getArticleInfo ||
  config.getInfo.getLiveRoomInfo

export default class Bilibili {
  logger: Logger

  constructor() {
    this.logger = makeLogger({ pluginName: 'bilibili' })
  }

  async init() {
    eventReg({
      type: 'message',
      pluginName: 'gugu',
      callback: (context) => this.message(context)
    })
  }

  async message(context: AllHandlers['message']) {
    const firstMessage = context.message[0]
    let url = ''
    let isMiniProgram = false

    console.log(firstMessage)

    if (firstMessage.type === 'text') {
      url = firstMessage.data.text
    } else if (firstMessage.type === 'json') {
      const data = JSON.parse(firstMessage.data.data)
      url = data?.meta?.detail_1?.qqdocurl || data?.meta?.news?.jumpUrl
      isMiniProgram = firstMessage.data.data.includes('com.tencent.miniapp_01')
    } else {
      return
    }

    if (!url) return

    console.log(url, isMiniProgram)
  }
}

//   const param = await getIdFromMsg(url)
//   const { avid, bvid, dyid, arid, lrid } = param

//   if (bilibiliConfig.despise && isMiniProgram && (avid || bvid || dyid || arid || lrid)) {
//     await quickOperation({
//       context,
//       operation: { reply: Image({ url: 'https://i.loli.net/2020/04/27/HegAkGhcr6lbPXv.png' }) }
//     })
//   }

//   if (getInfo.getVideoInfo && (avid || bvid)) {
//     return await reply(context, await getVideoInfo({ aid: avid, bvid }), isMiniProgram)
//   }

//   if (getInfo.getDynamicInfo && dyid) {
//     return await reply(context, await getDynamicInfo(dyid), isMiniProgram)
//   }

//   if (getInfo.getArticleInfo && arid) {
//     return await reply(context, await getArticleInfo(arid), isMiniProgram)
//   }

//   if (getInfo.getLiveRoomInfo && lrid) {
//     return await reply(context, await getLiveRoomInfo(lrid), isMiniProgram)
//   }
// }

// async function reply(
//   context: SocketHandle['message'],
//   message: SendMessageArray | SendMessageObject,
//   isMiniProgram: boolean
// ) {
//   await quickOperation({
//     context,
//     operation: { reply: message }
//   })
//   if (isMiniProgram) {
//     await bot.delete_message({ message_id: context.message_id })
//   }
// }

// const getIdFromMsg = async (msg: string) => {
//   const match = /((b23|acg)\.tv|bili2233.cn)\/[0-9a-zA-Z]+/.exec(msg)
//   if (match) return getIdFromShortLink(`https://${match[0]}`)
//   return getIdFromNormalLink(msg)
// }

// const getIdFromNormalLink = (link: string) => {
//   const searchVideo = /bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+))/i.exec(link) || []
//   const searchDynamic =
//     /t\.bilibili\.com\/(\d+)/i.exec(link) ||
//     /m\.bilibili\.com\/dynamic\/(\d+)/i.exec(link) ||
//     /www\.bilibili\.com\/opus\/(\d+)/i.exec(link) ||
//     []
//   const searchArticle = /bilibili\.com\/read\/(?:cv|mobile\/)(\d+)/i.exec(link) || []
//   const searchLiveRoom = /live\.bilibili\.com\/(\d+)/i.exec(link) || []
//   return {
//     avid: searchVideo[1],
//     bvid: searchVideo[2],
//     dyid: searchDynamic[1],
//     arid: searchArticle[1],
//     lrid: searchLiveRoom[1]
//   }
// }

// const getIdFromShortLink = async (shortLink: string) => {
//   return await retryHead(shortLink, {
//     maxRedirects: 0,
//     validateStatus: (status) => status >= 200 && status < 400
//   })
//     .then((ret) => getIdFromNormalLink(ret.headers.location))
//     .catch((e) => {
//       logger.WARNING(`[error] bilibili head short link ${shortLink}`)
//       logger.ERROR(e)
//       return {
//         avid: undefined,
//         bvid: undefined,
//         dyid: undefined,
//         arid: undefined,
//         lrid: undefined
//       }
//     })
// }
