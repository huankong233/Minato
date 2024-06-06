import { Logger, makeLogger } from '@/libs/logger.ts'
import Knex from 'knex'
import { config } from './config.ts'

export default class Database {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'database' })
  }

  async init() {
    try {
      global.knex = Knex({
        ...config,
        log: {
          inspectionDepth: 2,
          enableColors: true,
          debug: (msg) => this.#logger.DEBUG(msg)
        }
      })

      this.#logger.SUCCESS('连接数据库成功')
    } catch (error) {
      this.#logger.ERROR('连接数据库失败')
      this.#logger.DEBUG(error)
      this.#logger.ERROR('数据库配置:\n', config)
    }
  }
}
