import type { allEvents, Command } from '@/global.js'
import { BasePlugin } from '@/plugins/Base.ts'
import { type AllHandlers } from 'node-napcat-ts'

export const enable = false

export default class SearchImage extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: '空空搜图',
      description: '空空搜图',
      callback: (context, command) => this.search(context, command)
    }
  ]

  async search(context: AllHandlers['message'], command: Command) {}
}
