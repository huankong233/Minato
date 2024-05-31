import { Logger, makeLogger } from '@/libs/logger.ts'
import { DataSource } from 'typeorm'
import { User } from './Models/User.ts'
import { config } from './config.ts'

export default class Database {
  #logger: Logger

  constructor() {
    this.#logger = makeLogger({ pluginName: 'database' })
  }

  async init() {
    const database = new DataSource({
      ...config,
      entities: [User]
    })

    try {
      await database.initialize()

      global.User = database.getRepository(User)

      this.#logger.SUCCESS('连接数据库成功')
    } catch (error) {
      this.#logger.ERROR('连接数据库失败')
      this.#logger.DEBUG(error)
    }
  }
}
