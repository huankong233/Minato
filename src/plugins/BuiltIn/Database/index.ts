import { BasePlugin } from '@/plugins/Base.ts'
import Knex from 'knex'
import { config } from './config.ts'

export default class Database extends BasePlugin {
  async init() {
    try {
      global.knex = Knex(config)

      if (debug) {
        knex.on('query', (queryData) => {
          this.logger.DEBUG('发起数据库请求')
          this.logger.DIR(queryData)
        })
        knex.on('query-response', (responseData) => {
          this.logger.DEBUG('收到数据库成功响应')
          this.logger.DIR(responseData)
        })
      }

      knex.on('query-error', (err, queryData) => {
        this.logger.ERROR(`收到数据库失败响应`)
        this.logger.DIR(err, false)
        this.logger.DIR(queryData, false)
      })

      this.logger.SUCCESS('连接数据库成功')
    } catch (error) {
      this.logger.ERROR('连接数据库失败')
      this.logger.DIR(error)
      this.logger.ERROR('数据库配置:')
      this.logger.DIR(config)
    }
  }
}
