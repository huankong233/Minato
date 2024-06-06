import {
  type messageCallback,
  type messageEvent,
  type noticeCallback,
  type noticeEvent,
  type requestCallback,
  type requestEvent
} from '@/global.ts'
import { sortObjectArray } from '@/libs/array.ts'

/**
 * 事件快捷注册
 * @param type 事件类型
 * @param callback 回调函数
 * @param priority 优先级
 */
export function eventReg(
  params: (
    | { type: 'message'; callback: messageCallback }
    | { type: 'notice'; callback: noticeCallback }
    | { type: 'request'; callback: requestCallback }
  ) & {
    priority?: number
    pluginName: string
  }
) {
  params.priority = params.priority ?? 0
  switch (params.type) {
    case 'message':
      events.message = sortObjectArray([...events.message, params as messageEvent], 'priority')
      break
    case 'notice':
      events.notice = sortObjectArray([...events.notice, params as noticeEvent], 'priority')
      break
    case 'request':
      events.request = sortObjectArray([...events.request, params as requestEvent], 'priority')
      break
  }
}
