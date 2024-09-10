import { type allEvents } from '@/global.js'
import { zip } from '@/libs/array.ts'
import { deepEqual } from '@/libs/object.ts'
import { randomFloat } from '@/libs/random.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { type AllHandlers } from 'node-napcat-ts'
import { parse } from 'path'
import { config } from './config.ts'

export default class Repeat extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'message',
      callback: this.checkRepeat.bind(this)
    }
  ]

  repeat: { [key: number]: { message: AllHandlers['message']['message']; user_ids: number[] } } = {}

  async checkRepeat(context: AllHandlers['message']) {
    if (context.message_type === 'private') return
    const { group_id, message, user_id } = context

    // 随机几率复读
    if (randomFloat(0, 100) <= config.commonProb) {
      await sendMsg(context, context.message, { reply: false, at: false })
      delete this.repeat[group_id]
    }

    // 没记录过这个群组
    if (!this.repeat[group_id]) {
      this.repeat[group_id] = { message, user_ids: [user_id] }
      return
    }

    // 已经记录过你复读了
    if (this.repeat[group_id].user_ids.includes(user_id)) return

    // 长度一致
    let isSame = context.message.length === this.repeat[group_id].message.length
    if (isSame) {
      for (const [_index, contextMessage, repeatMessage] of zip(
        context.message,
        this.repeat[group_id].message
      )) {
        // 如果有类型不一致退出
        if (contextMessage.type !== repeatMessage.type) {
          isSame = false
          break
        }

        // 判断图片名称
        if (contextMessage.type === 'image' && repeatMessage.type === 'image') {
          if (parse(contextMessage.data.file).name !== parse(repeatMessage.data.file).name) {
            isSame = false
            break
          } else {
            continue
          }
        }

        // 直接比对
        if (!deepEqual(contextMessage, repeatMessage)) {
          isSame = false
          break
        }
      }
    }

    // 判断消息是否相同
    if (!isSame) {
      this.repeat[group_id] = { message, user_ids: [user_id] }
      return
    }

    this.repeat[group_id].user_ids.push(user_id)
    if (this.repeat[group_id].user_ids.length === config.count) {
      await sendMsg(context, this.repeat[group_id].message, { reply: false, at: false })
    }
  }
}
