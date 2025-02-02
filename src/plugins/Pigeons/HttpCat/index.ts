import type { allEvents, Command } from '@/global.js'
import axios from '@/libs/axios.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { Structs, type AllHandlers } from 'node-napcat-ts'

export default class HttpCat extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      callback: this.cat.bind(this),
      commandName: 'httpcat',
      params: [{ type: 'number', default: '200' }],
      description: 'httpcat [statuscode]',
    },
  ]

  async cat(context: AllHandlers['message'], command: Command) {
    const [code] = command.args
    let image

    try {
      image = await axios.get(`https://httpcats.com/${code}.jpg`, {
        responseType: 'arraybuffer',
      })
    } catch (_error) {
      image = await axios.get(`https://httpcats.com/404.jpg`, {
        responseType: 'arraybuffer',
      })
    }

    const base64 = Buffer.from(image.data).toString('base64')
    await sendMsg(context, [Structs.image(`base64://${base64}`)])
    return
  }
}
