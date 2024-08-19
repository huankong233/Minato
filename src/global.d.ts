import { type Knex } from 'knex'
import { type AllHandlers, type NCWebsocket } from 'node-napcat-ts'

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
  var Pigeon: () => Knex.QueryBuilder<Pigeon, {}>
  var PigeonHistory: () => Knex.QueryBuilder<PigeonHistory, {}>
}

export interface messageEvent {
  type: 'message'
  callback: (context: AllHandlers['message']) => Promise<void | 'quit'>
  priority?: number
  pluginName: string
}

export interface noticeEvent {
  type: 'notice'
  callback: (context: AllHandlers['notice']) => Promise<void | 'quit'>
  priority?: number
  pluginName: string
}

export interface requestEvent {
  type: 'request'
  callback: (context: AllHandlers['request']) => Promise<void | 'quit'>
  priority?: number
  pluginName: string
}

export interface Pigeon {
  user_id: number
  pigeon_num: number
  created_at: Date
  updated_at: Date
}

export interface PigeonHistory {
  id: number
  user_id: number
  operation: number
  origin_pigeon: number
  new_pigeon: number
  reason: string
  created_at: Date
}
