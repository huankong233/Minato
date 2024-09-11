import { type allEvents, type Command, type commandEvent } from '@/global.js'
import { sendMsg } from '@/libs/sendMsg.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import { config as botConfig } from '@/plugins/BuiltIn/Bot/config.ts'
import { type AllHandlers, Structs } from 'node-napcat-ts'

export default class Help extends BasePlugin {
  events: allEvents[] = [
    {
      type: 'command',
      commandName: 'help',
      description: 'help [commandName]',
      params: [{ type: 'string', default: 'all' }],
      callback: this.message.bind(this)
    }
  ]

  // 加载所有命令到缓存
  commands: commandEvent[] = events.command.filter((command) => !(command.hide ?? false))

  async message(context: AllHandlers['message'], command: Command) {
    const commandName = command.args[0]

    if (commandName === 'all') {
      await sendMsg(context, [
        Structs.text(
          '可用命令: ' + this.commands.map((command) => command.commandName.toString()).join(', ')
        )
      ])
      return
    }

    const found = this.commands.find((command) => command.commandName.toString() === commandName)
    if (!found) {
      await sendMsg(context, [Structs.text('找不到命令: ' + commandName)])
      return
    }

    await sendMsg(context, [
      Structs.text(
        [
          `命令参数格式(括号必选 中括号可选):`,
          `${botConfig.command_prefix}${found.description}`
        ].join('\n')
      )
    ])
  }
}
