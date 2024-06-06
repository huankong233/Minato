import { type Knex } from 'knex'
import { type AllHandlers, type NCWebsocket } from 'node-napcat-ts'

export interface Command {
  name: string
  args: string[]
}

declare global {
  var isDev: boolean
  var baseDir: string
  var bot: NCWebsocket
  var events: {
    message: messageEvent[]
    notice: noticeEvent[]
    request: requestEvent[]
  }
  var knex: Knex<any, unknown[]>
}

export type messageCallback = (
  context: AllHandlers['message'],
  command: Command | false
) => Promise<void | 'quit'>

interface messageEvent {
  callback: messageCallback
  priority: number
  pluginName: string
}

export type noticeCallback = (context: AllHandlers['notice']) => Promise<void | 'quit'>

interface noticeEvent {
  callback: noticeCallback
  priority: number
  pluginName: string
}

export type requestCallback = (context: AllHandlers['request']) => Promise<void | 'quit'>

interface requestEvent {
  callback: requestCallback
  priority: number
  pluginName: string
}
