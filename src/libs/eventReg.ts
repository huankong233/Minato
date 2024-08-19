import { type messageEvent, type noticeEvent, type requestEvent } from '@/global.ts'
import { sortObjectArray } from '@/libs/array.ts'

/**
 * 事件快捷注册
 */
export function eventReg(params: messageEvent | noticeEvent | requestEvent) {
  params.priority = params.priority ?? 1
  switch (params.type) {
    case 'message':
      events.message = sortObjectArray([...events.message, params], 'priority')
      break
    case 'notice':
      events.notice = sortObjectArray([...events.notice, params], 'priority')
      break
    case 'request':
      events.request = sortObjectArray([...events.request, params], 'priority')
      break
  }
}
