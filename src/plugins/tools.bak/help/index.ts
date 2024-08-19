import { Command } from '@/global.ts'
import { eventReg } from '@/libs/eventReg.ts'
import { makeLogger, type Logger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { MessageHandler } from 'node-napcat-ts'

export default class Help {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'help' })
  }

  async init() {
    eventReg({
      type: 'command',
      describe: 'help [命令名]',
      pluginName: 'help',
      callback: (context, command) => this.message(context, command),
      name: 'help',
      params: [{ type: 'string', default: 'all' }]
    })
  }

  async message(context: MessageHandler['message'], command: Command) {
    const commandName = command.args[0]

    if (commandName === 'all') {
      await sendMsg(context, '可用命令:' + events.command.map((v) => v.name).join(','))
      return
    }

    const found = events.command.find((v) => v.name === commandName)
    if (!found) {
      await sendMsg(context, '找不到命令:' + commandName)
      return
    }

    await sendMsg(context, found.describe)
  }
}
