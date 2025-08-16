/**
 * 代码借鉴于:https://github.com/Tsuk1ko/cq-picsearcher-bot
 */

import type { allEvents } from '@/global.js'
import axios from '@/libs/axios.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { type AllHandlers } from 'node-napcat-ts'
import { config } from './config.ts'
import { getArticleInfo } from './libs/article.ts'
import { getLiveRoomInfo } from './libs/live.ts'
import { getVideoJumpTime } from './libs/utils.ts'
import { getVideoInfo } from './libs/video.ts'

export const enable = config.recallMiniProgram || config.getInfo.getVideoInfo || config.getInfo.getArticleInfo || config.getInfo.getLiveRoomInfo

export default class Bilibili extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'message',
      callback: this.message.bind(this),
    },
  ]

  async message(context: AllHandlers['message']) {
    const firstMessage = context.message[0]

    let url
    let isMiniProgram = false

    if (firstMessage.type === 'text') {
      url = firstMessage.data.text
    } else if (firstMessage.type === 'json') {
      const data = JSON.parse(firstMessage.data.data)
      url = data?.meta?.detail_1?.qqdocurl || data?.meta?.news?.jumpUrl
      isMiniProgram = firstMessage.data.data.includes('com.tencent.miniapp_01')
    }

    if (!url) return

    const param = await this.getIdFromMsg(url)
    const { avid, bvid, arid, lrid, videoJump } = param
    if (!avid && !bvid && !arid && !lrid) return

    if (isMiniProgram) {
      if (context.message_type === 'group' && config.recallMiniProgram) {
        const userInfo = await bot.get_group_member_info({
          group_id: context.group_id,
          user_id: context.self_id,
        })
        if (userInfo.role === 'owner' || (userInfo.role === 'admin' && context.sender.role === 'member')) {
          await bot.delete_msg({ message_id: context.message_id })
        }
      }
    }

    if (config.getInfo.getVideoInfo && (avid || bvid)) {
      const res = await getVideoInfo({ aid: avid, bvid, videoJump }, this.logger)
      await sendMsg(context, res)
      return
    }

    if (config.getInfo.getLiveRoomInfo && lrid) {
      const res = await getLiveRoomInfo(lrid, this.logger)
      await sendMsg(context, res)
      return
    }
    if (config.getInfo.getArticleInfo && arid) {
      const res = await getArticleInfo(arid, this.logger)
      await sendMsg(context, res)
      return
    }
  }

  getIdFromMsg = async (msg: string) => {
    const match = /((b23|acg)\.tv|bili2233\.cn)\/[0-9a-zA-Z]+/.exec(msg)
    if (match) return this.getIdFromShortLink(`https://${match[0]}`)
    return this.getIdFromNormalLink(msg)
  }

  getIdFromNormalLink = (link: string) => {
    const searchVideo = /bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+))(?:\/?\?\S*\b(t|start_progress)=([\d.]+))?/i.exec(link) || []
    const searchArticle = /bilibili\.com\/read\/(?:cv|mobile\/)(\d+)/i.exec(link) || []
    const searchLiveRoom = /live\.bilibili\.com\/(\d+)/i.exec(link) || []
    return {
      avid: searchVideo[1],
      bvid: searchVideo[2],
      arid: searchArticle[1],
      lrid: searchLiveRoom[1],
      videoJump: getVideoJumpTime(searchVideo[3], searchVideo[4]),
    }
  }

  getIdFromShortLink = async (shortLink: string) => {
    return await axios
      .head(shortLink, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      })
      .then((ret) => this.getIdFromNormalLink(ret.headers.location))
      .catch((error) => {
        this.logger.ERROR(`B站短链转换失败 ${shortLink}`)
        this.logger.DIR(error, false)
        return {
          avid: undefined,
          bvid: undefined,
          arid: undefined,
          lrid: undefined,
          videoJump: undefined,
        }
      })
  }
}
