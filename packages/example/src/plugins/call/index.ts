import { BasePlugin, type RegEventOptionsWithoutPluginName } from '@huan_kong/minato'

export interface CallPluginConfig {
  admin_id: number[]
}

export class Plugin extends BasePlugin<CallPluginConfig> {
  name = 'call'
  version = '1.0.0'
  default_config = {
    admin_id: [],
  }

  install() {}

  uninstall() {}

  events: RegEventOptionsWithoutPluginName[] = []
}
