import { config as botConfig } from '@/plugins/builtIn/bot/config.ts'
import { Command } from '@/global.js'
import { eventReg } from '@/libs/eventReg.ts'
// import { makeLogger, type Logger } from '@/libs/logger.ts'
import { sendMsg } from '@/libs/sendMsg.ts'
import { MessageHandler, Structs } from 'node-napcat-ts'

export default class Help {
  // #logger: Logger

  constructor() {
    // this.#logger = makeLogger({ pluginName: 'help' })
  }

  async init() {
    eventReg({
      type: 'command',
      pluginName: 'help',
      commandName: 'help',
      description: 'help [commandName]',
      params: [{ type: 'string', default: 'all' }],
      callback: (context, command) => this.message(context, command)
    })
  }

  async message(context: MessageHandler['message'], command: Command) {
    const commandName = command.args[0]
    const commands = events.command.filter((command) => !(command.hide ?? false))

    if (commandName === 'all') {
      await sendMsg(context, [
        Structs.text({
          text: '可用命令:' + commands.map((command) => command.commandName).join(',')
        })
      ])
      return
    }
    const found = commands.find((command) => command.commandName === commandName)
    if (!found) {
      await sendMsg(context, [Structs.text({ text: '找不到命令:' + commandName })])
      return
    }
    await sendMsg(context, [
      Structs.text({
        text: [
          `${found.commandName}的命令格式(括号必选 中括号可选):`,
          `${botConfig.command_prefix}${found.description}`
        ].join('\n')
      })
    ])
  }
}
