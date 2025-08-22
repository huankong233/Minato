import { Logger } from '@/libs/logger.ts'

export class Minato {
  base_dir: string
  logger: Logger

  constructor(base_dir: string) {
    this.base_dir = base_dir
    this.logger = new Logger()

    this.logger.SUCCESS(`Minato initialized with base directory: ${this.base_dir}`)
  }

  load_plugin(plugin_name: string) {
    this.logger.INFO(`Loading plugin: ${plugin_name}`)
    this.logger.SUCCESS(`Plugin ${plugin_name} loaded successfully`)
  }

  load_config(config_name: string) {
    this.logger.INFO(`Loading config: ${config_name}`)
    this.logger.SUCCESS(`Config ${config_name} loaded successfully`)
  }
}
