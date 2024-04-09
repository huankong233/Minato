import { globalReg } from '@/libs/globalReg.ts'
import { makeLogger } from '@/libs/logger.ts'
import { jsonc } from 'jsonc'
import Knex from 'knex'
const { knex } = Knex

const logger = makeLogger({ pluginName: 'knex' })
const debuglogger = makeLogger({ pluginName: 'knex', subModule: 'sql' })

export default async function () {
  const { knexConfig } = global.config as { knexConfig: knexConfig }

  try {
    const database = knex({
      ...knexConfig,
      log: {
        debug(message: string) {
          debuglogger.DEBUG('发起一条SQL查询\n', message)
        }
      }
    })

    globalReg({ database })
    logger.SUCCESS('连接数据库成功')
  } catch (error) {
    logger.WARNING('连接数据库失败,请检查数据库设置或数据库可能未运行')
    logger.INFO('数据库配置:\n', jsonc.stringify(knexConfig))
    logger.ERROR(error)
  }
}
