import { type Pigeon, type PigeonHistory } from '@/global.ts'
import { BasePlugin } from '@/plugins/Base.ts'
import Gugu from '@/plugins/Pigeons/GuGu/index.ts'
import { type AllHandlers } from 'node-napcat-ts'

export default class PigeonTool extends BasePlugin {
  static async getUserData(context: AllHandlers['message'], makeNew = true) {
    const { user_id } = context
    const user = await knex<Pigeon>('pigeons').where({ user_id }).first()
    if (makeNew) {
      if (user) return user
      await Gugu.gugu(context)
      return (await knex<Pigeon>('pigeons').where({ user_id }).first()) as Pigeon
    } else {
      return user
    }
  }

  static async add(context: AllHandlers['message'], operation: number, reason: string) {
    //不允许增加负数的鸽子
    if (operation <= 0) return false
    return await this.operatePigeon(context, +operation, reason)
  }

  static async reduce(context: AllHandlers['message'], operation: number, reason: string) {
    //不允许减少负数的鸽子
    if (operation <= 0) return false
    return await this.operatePigeon(context, -operation, reason)
  }

  static async operatePigeon(context: AllHandlers['message'], operation: number, reason: string) {
    const { user_id } = context
    const userData = (await this.getUserData(context)) as Pigeon
    const { pigeon_num: origin_pigeon } = userData
    const new_pigeon = origin_pigeon + operation
    if (new_pigeon < 0) return false
    await knex<Pigeon>('pigeons').where({ user_id }).update({ pigeon_num: new_pigeon })

    await knex<PigeonHistory>('pigeon_histories').insert({
      user_id,
      operation: operation,
      origin_pigeon,
      new_pigeon,
      reason,
    })
    return true
  }
}
