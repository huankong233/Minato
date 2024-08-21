import { type Send } from 'node-napcat-ts'
import { makeSystemLogger } from './logger.ts'

const logger = makeSystemLogger({ pluginName: 'sendMsg' })

export async function sendMsg(
  context:
    | { message_type: 'private'; user_id: number }
    | { message_type: 'group'; group_id: number },
  message: Send[keyof Send][]
) {
  logger.DEBUG(`发送消息:`)
  logger.DIR(message)

  const { message_type } = context

  let response

  try {
    switch (message_type) {
      case 'private':
        //回复私聊
        const { user_id } = context
        response = await bot.send_private_msg({ user_id, message })
        break
      case 'group':
        //回复群
        const { group_id } = context
        response = await bot.send_group_msg({ group_id, message })
        break
    }
  } catch (error) {
    logger.ERROR('发送消息失败!!!')
    logger.ERROR('error信息:')
    logger.ERROR(error)
    logger.ERROR(`stack信息:\n${new Error().stack}`)

    return
  }

  logger.DEBUG('发送消息成功!!!')
  logger.DEBUG(`响应:`)
  logger.DIR(response)
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
  logger.DEBUG(`发送合并消息:`)
  logger.DIR(message)

  const { message_type } = context

  let response

  try {
    switch (message_type) {
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
  } catch (error) {
    logger.ERROR('发送消息失败!!!')
    logger.ERROR('error信息:')
    logger.ERROR(error)
    logger.ERROR(`stack信息:\n${new Error().stack}`)

    return
  }

  logger.DEBUG('发送成功!!!')
  logger.DEBUG(`响应:`)
  logger.DIR(response)
  logger.DEBUG(`stack信息:\n${new Error().stack}`)

  return response
}
