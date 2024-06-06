export type user = { user_id: number; reply?: string } | number
export type group = { group_id: number; reply?: string } | number

export type BlockConfig = {
  defaultReply: string
  allowUsers?: number[]
  allowGroups?: number[]
  blockUsers?: user[]
  blockGroups?: group[]
  commands?: {
    name: RegExp | string
    reply?: string
    allowUsers?: number[]
    allowGroups?: number[]
    blockUsers?: user[]
    blockGroups?: group[]
  }[]
}

/**
 * 优先使用单元内的reply对象,如果不存在即使用defaultReply
 * 如果回复内容为空字符串,就不会发送内容
 */

export const config: BlockConfig = {
  defaultReply: '默认回复',
  blockUsers: [],
  blockGroups: [],
  commands: []
}
