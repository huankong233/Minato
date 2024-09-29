import type { allEvents, Command } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import mc from 'minecraftstatuspinger'
import type { ServerStatus } from 'minecraftstatuspinger/dist/types.js'
import { Structs, type AllHandlers } from 'node-napcat-ts'

export default class Mute extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: 'motd',
      params: [{ type: 'string' }, { type: 'number', default: '25565' }],
      description: 'motd (host) [port]',
      callback: this.motd.bind(this)
    }
  ]

  async motd(context: AllHandlers['message'], command: Command) {
    let host = command.args[0]
    let port = command.args[1]
    if (host.includes(':')) {
      const arr = host.split(':')
      host = arr[0]
      port = arr[1]
    }

    let status: ServerStatus
    try {
      status = await mc.lookup({
        host,
        port: parseFloat(port),
        timeout: 10000,
        ping: true
      })
    } catch (error) {
      this.logger.ERROR(`查询${host}:${port}失败`)
      this.logger.DIR(error, false)
      await sendMsg(context, [Structs.text(`查询${host}:${port}失败`)])
      return
    }

    if (!status.status) {
      this.logger.ERROR(`查询${host}:${port}失败`)
      this.logger.DIR(status, false)
      await sendMsg(context, [Structs.text(`查询${host}:${port}失败`)])
      return
    }

    const data = status.status
    await sendMsg(context, [
      Structs.image('base64://' + data.favicon.split(',')[1]),
      Structs.text(`服务器信息: ${data.version.name}\n`),
      Structs.text(`在线玩家: [${data.players.online}/${data.players.max}]\n`),
      Structs.text(`MOTD: ${this.extractTextFromJson(data.description)}\n`)
    ])
  }

  extractTextFromJson(json: any) {
    // 递归提取文本内容
    function recursiveExtract(obj: any) {
      let result = ''
      if (Array.isArray(obj)) {
        // 如果是数组，遍历数组中的每个元素
        obj.forEach((item) => {
          result += recursiveExtract(item)
        })
      } else if (typeof obj === 'object') {
        // 如果是对象，检查是否有 'text' 属性并提取
        if (obj.text) {
          result += obj.text
        }
        // 如果有 'extra' 属性，递归提取 'extra' 中的内容
        if (obj.extra) {
          result += recursiveExtract(obj.extra)
        }
      }
      return result
    }

    return recursiveExtract(json)
  }
}
