import { Structs, type Send } from 'node-napcat-ts'
import { makeSystemLogger } from './logger.ts'

const logger = makeSystemLogger({ pluginName: 'sendMsg' })

export async function sendMsg(
  context:
    | { message_type: 'private'; user_id: number; message_id?: number }
    | { message_type: 'group'; group_id: number; user_id?: number; message_id?: number },
  message: Send[keyof Send][],
  { reply = true, at = false } = {}
) {
  let response
  try {
    switch (context.message_type) {
      case 'private':
        //回复私聊
        const { user_id } = context
        response = await bot.send_private_msg({ user_id, message })
        break
      case 'group':
        //回复群
        const { group_id } = context
        if (reply && context.message_id) message.unshift(Structs.reply({ id: context.message_id }))
        if (at && context.user_id) message.unshift(Structs.at({ qq: context.user_id }))
        response = await bot.send_group_msg({ group_id, message })
        break
    }
  } catch (_error) {
    logger.ERROR('发送消息失败!!!')
    logger.ERROR(`stack信息:\n${new Error().stack}`)
    return
  }

  logger.DEBUG('发送消息成功!!!')
  logger.DEBUG(`stack信息:\n${new Error().stack}`)
  return response
}

/**
 * 合并信息发送
 * docs:https://docs.go-cqhttp.org/cqcode/#合并转发
 * @param context 消息对象
 * @param messages
 */
export async function sendForwardMsg(
  context:
    | { message_type: 'group'; group_id: number }
    | { message_type: 'private'; user_id: number },
  message: Send['node'][]
) {
  let response
  try {
    switch (context.message_type) {
      case 'private':
        response = await bot.send_private_forward_msg({
          user_id: context.user_id,
          message
        })
        break
      case 'group':
        response = await bot.send_group_forward_msg({
          group_id: context.group_id,
          message
        })
        break
    }
  } catch (_error) {
    logger.ERROR('发送消息失败!!!')
    logger.ERROR(`stack信息:\n${new Error().stack}`)
    return
  }

  logger.DEBUG('发送成功!!!')
  logger.DEBUG(`stack信息:\n${new Error().stack}`)
  return response
}
