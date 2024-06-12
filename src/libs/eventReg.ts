import { commandEvent, type messageEvent, type noticeEvent, type requestEvent } from '@/global.ts'
import { sortObjectArray } from '@/libs/array.ts'

/**
 * 事件快捷注册
 */
export function eventReg(params: commandEvent | messageEvent | noticeEvent | requestEvent) {
  params.priority = params.priority ?? 1
  switch (params.type) {
    case 'command':
      events.command = sortObjectArray([...events.command, params], 'priority')
      break
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
