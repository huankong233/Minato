import type { Bot } from '@/bot.ts'
import type { Minato } from '@/minato.ts'
import type { RegEventOptionsWithoutPluginName } from '@/reg_event.ts'

export abstract class BasePlugin<TConfig = object> {
  abstract name: string
  abstract version: string
  abstract events: RegEventOptionsWithoutPluginName[]

  default_config?: TConfig
  config!: TConfig
  dependencies?: { [key: string]: string } = {}

  abstract install(minato: Minato, bot: Bot): void | Promise<void>
  abstract uninstall(minato: Minato, bot: Bot): void | Promise<void>
}
