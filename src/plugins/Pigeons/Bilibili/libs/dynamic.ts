/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import axios from '@/libs/axios.ts'
import { humanNum } from '@/libs/humanNum.ts'
import { type Logger } from '@/libs/logger.ts'
import { Structs } from 'node-napcat-ts'
import { FAKE_COOKIE, USER_AGENT } from './const.ts'
import { purgeLinkInText } from './utils.ts'

export const getDynamicInfo = async (id: string, logger: Logger) => {
  try {
    const response = await axios.get('https://api.bilibili.com/x/polymer/web-dynamic/v1/detail', {
      timeout: 10000,
      params: {
        timezone_offset: new Date().getTimezoneOffset(),
        id,
        features: 'itemOpusStyle'
      },
      headers: {
        'User-Agent': USER_AGENT,
        Referer: 'https://www.bilibili.com/',
        Cookie: FAKE_COOKIE
      }
    })

    const { code, message, data } = response.data

    if (code === 4101131 || code === 4101105) return [Structs.text('动态不存在')]
    if (code !== 0) return [Structs.text(`Error: (${code})${message}`)]
    if (!data?.item) return [Structs.text('Error: 无内容')]

    return await formatDynamic(data.item)
  } catch (error) {
    logger.ERROR(`B站动态信息获取失败`)
    logger.DIR({ id }, false, false)
    logger.DIR(error, false, false)
    return [Structs.text('动态信息获取失败~')]
  }
}

const additionalFormatters = {
  // 投票
  ADDITIONAL_TYPE_VOTE: ({ vote: { desc, end_time, join_num } }) => [
    Structs.text(
      [
        `【投票】${desc}`,
        `截止日期：${new Date(end_time * 1000).toLocaleString()}`,
        `参与人数：${humanNum(join_num)}`,
        '投票详情见原动态'
      ].join('\n')
    )
  ],

  // 预约
  ADDITIONAL_TYPE_RESERVE: ({ reserve: { title, desc1, desc2 } }) => {
    const lines = [title]
    const desc = [desc1?.text, desc2?.text].filter((v) => v)
    if (desc.length > 0) lines.push(desc.join('  '))
    return [Structs.text(lines.join('\n'))]
  }
}

const majorFormatters = {
  // 图片
  MAJOR_TYPE_DRAW: ({ draw: { items } }) => items.map(({ src }) => Structs.image(src)),

  // 视频
  MAJOR_TYPE_ARCHIVE: ({ archive: { cover, aid, bvid, title, stat } }) => [
    Structs.image(cover),
    Structs.text(
      [
        `av${aid}`,
        title?.trim(),
        `${stat.play}播放 ${stat.danmaku}弹幕`,
        `https://www.bilibili.com/video/${bvid}`
      ].join('\n')
    )
  ],

  // 文章
  MAJOR_TYPE_ARTICLE: ({ article: { covers, id, title, desc } }) => [
    ...(covers.length ? [Structs.image(covers[0])] : []),
    Structs.text(
      [`《${title?.trim()}》`, desc?.trim(), `https://www.bilibili.com/read/cv${id}`].join('\n')
    )
  ],

  // 音乐
  MAJOR_TYPE_MUSIC: ({ music: { cover, id, title, label } }) => [
    Structs.image(cover),
    Structs.text(
      [`au${id}`, title?.trim(), `分类：${label}`, `https://www.bilibili.com/audio/au${id}`].join(
        '\n'
      )
    )
  ],

  // 直播
  MAJOR_TYPE_LIVE: ({ live: { cover, title, id, live_state, desc_first, desc_second } }) => [
    Structs.image(cover),
    Structs.text(
      [
        title,
        `房间号：${id}`,
        `分区：${desc_first}`,
        live_state ? `直播中  ${desc_second}` : '未开播',
        `https://live.bilibili.com/${id}`
      ].join('\n')
    )
  ],
  MAJOR_TYPE_LIVE_RCMD: ({ live_rcmd: { content } }) => {
    const {
      live_play_info: {
        cover,
        title,
        room_id,
        live_status,
        parent_area_name,
        area_name,
        watched_show: { text_large }
      }
    } = JSON.parse(content)
    return [
      Structs.image(cover),
      Structs.text(
        [
          title,
          `房间号：${room_id}`,
          `分区：${parent_area_name}・${area_name ? `${area_name}` : ''}`,
          live_status ? `直播中  ${text_large}` : '未开播',
          `https://live.bilibili.com/${room_id}`
        ].join('\n')
      )
    ]
  },

  // 通用动态？
  MAJOR_TYPE_OPUS: async ({ opus }) => {
    const {
      pics,
      summary: { text },
      title
    } = opus
    const lines = []
    if (title) lines.push(Structs.text(`《${title.trim()}》\n`))
    if (text) lines.push(Structs.text(`${text.trim()}\n`))
    if (pics.length) lines.push(...pics.map(({ url }) => Structs.image(url)))
    return lines
  }
}

const formatDynamic = async (item: any) => {
  const { module_author: author, module_dynamic: dynamic } = item.modules
  const lines = [
    Structs.text([`https://t.bilibili.com/${item.id_str}`, `UP: ${author.name}`].join('\n'))
  ]

  const desc = dynamic?.desc?.text?.trim()
  if (desc) lines.push(Structs.text(purgeLinkInText(desc)))

  const major = dynamic?.major
  if (major && major.type in majorFormatters) {
    lines.push(...(await majorFormatters[major.type](major)))
  }

  const additional = dynamic?.additional
  if (additional && additional.type in additionalFormatters) {
    lines.push(...(await additionalFormatters[additional.type](additional)))
  }

  if (item.type === 'DYNAMIC_TYPE_FORWARD') {
    if (item.orig.type === 'DYNAMIC_TYPE_NONE') {
      lines.push(Structs.text('【转发的源动态已被作者删除】'))
    } else {
      lines.push(...(await formatDynamic(item.orig)))
    }
  }

  return lines
}
