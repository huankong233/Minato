import { type Pigeon } from '@/global.ts'
import Gugu from '@/plugins/pigeons/gugu/index.ts'
import { MessageHandler } from 'node-napcat-ts'

export default class PigeonTool {
  static async getUserData(context: MessageHandler['message']): Promise<Pigeon> {
    const { user_id } = context
    const user = await Pigeon().where({ user_id }).first()
    if (user) return user
    await Gugu.gugu(context)
    return await Pigeon().where({ user_id }).first()
  }

  static async add(context: MessageHandler['message'], operation: number, reason: string) {
    //不允许增加负数的鸽子
    if (operation <= 0) return false
    return await this.operatePigeon(context, +operation, reason)
  }

  static async reduce(context: MessageHandler['message'], operation: number, reason: string) {
    //不允许减少负数的鸽子
    if (operation <= 0) return false
    return await this.operatePigeon(context, -operation, reason)
  }

  static async operatePigeon(
    context: MessageHandler['message'],
    operation: number,
    reason: string
  ) {
    const { user_id } = context
    const userData = await this.getUserData(context)
    const { pigeon_num: origin_pigeon } = userData
    const new_pigeon = origin_pigeon + operation
    await Pigeon().where({ user_id }).update({ pigeon_num: new_pigeon })

    await PigeonHistory().insert({
      user_id,
      operation: operation,
      origin_pigeon,
      new_pigeon,
      reason
    })
    return true
  }
}
