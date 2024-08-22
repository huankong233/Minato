import { type allEventsWithPluginName } from '@/global.ts'
import { sortObjectArray } from '@/libs/array.ts'

/**
 * 事件快捷注册
 */
export function eventReg(params: allEventsWithPluginName) {
  params.priority = params.priority ?? 1
  switch (params.type) {
    case 'command':
      events.command = sortObjectArray([...events.command, params], 'priority', 'down')
      break
    case 'message':
      events.message = sortObjectArray([...events.message, params], 'priority', 'down')
      break
    case 'notice':
      events.notice = sortObjectArray([...events.notice, params], 'priority', 'down')
      break
    case 'request':
      events.request = sortObjectArray([...events.request, params], 'priority', 'down')
      break
  }
}
