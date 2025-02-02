/* eslint-disable no-var */
import type { Hono } from 'hono'
import type { Knex } from 'knex'
import type { AllHandlers, NCWebsocket } from 'node-napcat-ts'

declare global {
  var debug: boolean
  var baseDir: string
  var bot: NCWebsocket
  var events: {
    command: commandEvent[]
    message: messageEvent[]
    notice: noticeEvent[]
    request: requestEvent[]
  }
  var knex: Knex<any, unknown[]>
  var hono: Hono
}

// 使用映射类型去除 pluginName 属性
export type RemovePluginName<T> = {
  [K in keyof T as K extends 'pluginName' ? never : K]: T[K]
}

export type allEventsWithPluginName = commandEvent | messageEvent | noticeEvent | requestEvent

export type allEvents = RemovePluginName<allEventsWithPluginName>

export interface Command {
  name: string
  args: string[]
}

export type Param =
  | {
      type: 'string'
      default?: string
    }
  | {
      type: 'enum'
      enum: string[]
      default?: string
    }
  | {
      type: 'number'
      default?: string
    }

export interface commandEvent {
  type: 'command'
  callback: (context: AllHandlers['message'], command: Command) => Promise<void | 'quit'>
  commandName: string | RegExp
  description: string
  params?: Param[]
  priority?: number
  hide?: boolean
  pluginName: string
  needReply?: boolean
}

export interface messageEvent {
  type: 'message'
  callback: (context: AllHandlers['message']) => Promise<void | 'quit'>
  priority?: number
  pluginName: string
  needReply?: boolean
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

export interface Corpus {
  id: number
  user_id: number
  keyword: string
  reply: string
  mode: '模糊' | '精准'
  scene: '全部' | '私聊' | '群聊'
  created_at: Date
  deleted_at: Date | null
}

export interface RedPacket {
  id: number
  user_id: number
  packet_num: number
  pigeon_num: number
  code: string
  picked_user: string
  created_at: Date
}

export interface SeTu {
  user_id: number
  today_count: number
  total_count: number
  created_at: Date
  updated_at: Date
}
