import type { manifest } from '@libs/loadPlugin.ts'
import type { CQEvent, CQWebSocket } from '@huan_kong/go-cqwebsocket'
import type { commandFormat } from '@libs/eventReg.ts'
import type { Knex } from 'knex'

export type messageCallback = (
  event: CQEvent<'message'>,
  command: commandFormat | false
) => Promise<void | 'quit'>

export type noticeCallback = (event: CQEvent<'notice'>) => Promise<void | 'quit'>

export type requestCallback = (event: CQEvent<'request'>) => Promise<void | 'quit'>
interface messageEvent {
  callback: messageCallback
  priority: number
  pluginName: string
}

interface noticeEvent {
  callback: noticeCallback
  priority: number
  pluginName: string
}

interface requestEvent {
  callback: requestCallback
  priority: number
  pluginName: string
}

declare global {
  var events: {
    message: messageEvent[]
    notice: noticeEvent[]
    request: requestEvent[]
  }
  var plugins: {
    [pluginName: string]: {
      pluginPath: string
      configPath: string | null
      manifest: manifest
      loaded: boolean
    }
  } = {}
  var config: { [pluginNameConfig: string]: any } = {}
  var data: { [pluginNameData: string]: any } = {}
  var debug: boolean
  var dev: boolean
  var baseDir: string
  var nowLoadPluginName: string
  var packageData: {
    version: string
    plguinVersion: string
  }
  var bot: CQWebSocket
  var database: Knex
}

export {}
