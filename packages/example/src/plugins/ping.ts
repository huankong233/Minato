import { BasePlugin, define_command_event, define_message_event, Structs, type RegEventOptionsWithoutPluginName } from '@huan_kong/minato'

export class Plugin extends BasePlugin {
  name = 'ping'
  version = '1.0.0'
  dependencies = {
    call: '^1.0.0',
  }

  install() {}

  uninstall() {}

  events: RegEventOptionsWithoutPluginName[] = [
    define_command_event({
      command_name: 'ping',
      description: 'ping the bot',
      params: [{ type: 'string', default: 'pong' }],
      callback: async (context, params) => {
        await context.quick_action([Structs.text(params[0])])
      },
    }),
    define_message_event({
      end_point: 'message.private',
      callback: async (context) => {
        await context.quick_action([Structs.text('aa')])
      },
    }),
  ]
}
